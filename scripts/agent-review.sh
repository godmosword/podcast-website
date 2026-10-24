#!/usr/bin/env bash
# 外部審查者（Codex 工程審／cursor-agent 對抗審／grok 備援）的統一跑法。
#
# 為什麼要包一層（2026-10-23 grok 對抗審空轉 8 小時，見 docs/AGENT-FAILURES.md）：
# 1. Mac 用電池時閒置 1 分鐘就睡。背景審查沒有人在操作，機器一睡，進行中的串流請求就斷，
#    grok 每次重試都要等到逾時（約 8 分鐘），15 次重試拖過整晚。
#    → 有 caffeinate 就用 -i 包住，審查期間不閒置睡眠（闔上螢幕仍會睡）。
# 2. 沒有時間上限，卡住也沒人知道。→ timeout，預設 900 秒，逾時結束碼 124。
# 3. prompt 叫它「需要時自己讀相關檔案」：grok 光基底就約 5 萬 token，讀完大檔衝到 20 萬，
#    觸發自動壓縮又失敗。→ grok 加 --max-turns、--disable-web-search、--output-format plain；
#    -p（--single）是非互動模式。prompt 一律寫成檔案、限定可讀的檔（見 docs/AGENT-WORKFLOW.md）。
# 4. GNU timeout 預設把命令放進新的背景程序群組。審查者若去開 /dev/tty（stdin 已接到
#    /dev/null 也擋不住），核心送 SIGTTIN，程序停在 stat T，輸出是空的，直到逾時。
#    → 前景加 timeout --foreground，讓它留在前景程序群組。
#    → --detach 先 fork 再 setsid（macOS 沒有 setsid 指令；組長直接 setsid 會失敗），
#      新 session 沒有控制終端，stdin 接 /dev/null，stdout／stderr 寫進檔。
#
# 用法：
#   scripts/agent-review.sh [--detach] <engineering|adversarial|adversarial-grok> <prompt-file> <out-file>
#
#   stdout → <out-file>，stderr → <out-file>.err，結束碼 → <out-file>.done（124 = 逾時）。
#   --detach：用 nohup 在背景跑、立刻返回；Claude Code 的 session 重啟不會把它砍掉。
#             呼叫端等 <out-file>.done 出現再讀結果。
#
# 環境變數：AGENT_REVIEW_TIMEOUT（秒，預設 900）、AGENT_REVIEW_KILL_AFTER（逾時後再等幾秒送 KILL，預設 30）、
# AGENT_REVIEW_MAX_TURNS（grok，預設 40）。
set -euo pipefail

usage() {
  echo "用法：$0 [--detach] <engineering|adversarial|adversarial-grok> <prompt-file> <out-file>" >&2
  exit 2
}

detach=false
if [ "${1:-}" = "--detach" ]; then
  detach=true
  shift
fi

[ "$#" -eq 3 ] || usage
role="$1"
prompt_file="$2"
out="$3"

case "$role" in
  engineering|adversarial|adversarial-grok) ;;
  *) echo "不認得的審查角色：$role" >&2; usage ;;
esac
if [ ! -f "$prompt_file" ]; then
  echo "找不到 prompt 檔：$prompt_file" >&2
  exit 2
fi

if [ "$detach" = true ]; then
  rm -f "$out.done"
  # 開新 session：只有 nohup 的話還留在呼叫端的程序群組，Claude Code 收 session 時整組砍掉就一起死。
  # macOS 沒有 setsid 指令。用 & 啟動時這個 perl 自己就是程序群組組長，
  # 直接 POSIX::setsid() 會回 -1 卻仍 exec，審查者留在有控制終端的背景群組。
  # 先 fork，子程序不是組長，setsid 才成功；stdin 已接到 /dev/null。
  if command -v setsid >/dev/null 2>&1; then
    nohup setsid bash "$0" "$role" "$prompt_file" "$out" </dev/null >/dev/null 2>&1 &
  else
    nohup perl -MPOSIX -e 'fork() and exit 0; my $sid = POSIX::setsid(); die "setsid: $!\n" if !defined($sid) || $sid < 0; exec @ARGV or die "exec: $!\n"' \
      bash "$0" "$role" "$prompt_file" "$out" </dev/null >/dev/null 2>&1 &
  fi
  echo "已在背景開始 ${role} 審查；完成時寫入 ${out}.done"
  exit 0
fi

timeout_secs="${AGENT_REVIEW_TIMEOUT:-900}"
max_turns="${AGENT_REVIEW_MAX_TURNS:-40}"
prompt="$(cat "$prompt_file")"

case "$role" in
  engineering)
    cmd=(codex exec -m gpt-6-luna -s read-only -c model_reasoning_effort="medium" "$prompt")
    ;;
  adversarial)
    cmd=(cursor-agent -p --trust --mode ask --model grok-4.7-high-fast "$prompt")
    ;;
  adversarial-grok)
    # -p 是 --single（非互動，印完就結束）。--output-format plain 走 headless，不畫 TUI。
    cmd=(grok -m grok-4.7 --permission-mode plan --max-turns "$max_turns" --disable-web-search --output-format plain -p "$prompt")
    ;;
esac

# 時間上限放最外層。GNU timeout 預設 setpgid，命令會落在背景程序群組，
# 一讀 /dev/tty 就被 SIGTTIN 停住；--foreground 讓它留在呼叫端的前景群組。
# --foreground 只殺直接子程序，所以中間放一層 perl：收到訊號就沿著程序樹往下收。
# 沒有 timeout 時同一支 perl 自己計時。AGENT_REVIEW_TIMEOUT_IMPL=perl 強制走這條，給測試用。
# 不另開程序群組：kill -負pid 會連同這個 shell 一起殺。
kill_after="${AGENT_REVIEW_KILL_AFTER:-30}"
reaper=$(cat <<'PERL'
use strict;
use warnings;

sub descendants {
  my ($root) = @_;
  my %kids;
  if (open my $ps, "-|", "ps", "-ax", "-o", "pid=,ppid=") {
    while (<$ps>) {
      my ($p, $pp) = split;
      next unless defined $p && $p =~ /^[0-9]+$/ && defined $pp && $pp =~ /^[0-9]+$/;
      push @{$kids{$pp}}, $p;
    }
    close $ps;
  }
  my @all;
  my @q = ($root);
  my %seen = ($root => 1);
  while (@q) {
    my $cur = shift @q;
    for my $c (@{$kids{$cur} // []}) {
      next if $seen{$c}++;
      push @all, $c;
      push @q, $c;
    }
  }
  return @all;
}

sub signal_tree {
  my ($root, $sig) = @_;
  my @kids = descendants($root);
  kill $sig, @kids, $root;
}

my $mode = shift @ARGV;
my $secs;
if ($mode eq "alarm") {
  $secs = shift @ARGV;
  die "timeout seconds\n" unless defined $secs && $secs =~ /^[0-9]+$/;
} elsif ($mode ne "outer") {
  die "reaper mode\n";
}
shift @ARGV if @ARGV && $ARGV[0] eq "--";

my $pid = fork() // die "fork: $!";
if ($pid == 0) { exec @ARGV or die "exec: $!"; }

my $stop = sub {
  my ($sig, $code) = @_;
  signal_tree($pid, $sig);
  sleep 1;
  signal_tree($pid, "KILL");
  exit $code;
};
$SIG{TERM} = sub { $stop->("TERM", 143) };
$SIG{INT} = sub { $stop->("INT", 130) };
$SIG{HUP} = sub { $stop->("HUP", 129) };
if ($mode eq "alarm") {
  $SIG{ALRM} = sub { $stop->("TERM", 124) };
  alarm $secs;
}
waitpid($pid, 0);
exit(($? & 127) ? 128 + ($? & 127) : $? >> 8);
PERL
)
impl="${AGENT_REVIEW_TIMEOUT_IMPL:-auto}"
if [ "$impl" != perl ] && command -v timeout >/dev/null 2>&1; then
  # perl 會把 --outer 當成自己的開關，模式字不能以 - 開頭；-- 只用來隔開審查者的參數。
  limit=(timeout --foreground --kill-after="$kill_after" "$timeout_secs" perl -e "$reaper" outer --)
elif [ "$impl" != perl ] && command -v gtimeout >/dev/null 2>&1; then
  limit=(gtimeout --foreground --kill-after="$kill_after" "$timeout_secs" perl -e "$reaper" outer --)
else
  limit=(perl -e "$reaper" alarm "$timeout_secs" --)
fi

awake=()
if command -v caffeinate >/dev/null 2>&1; then
  awake=(caffeinate -i)
fi

# 被 TERM／INT／HUP 中斷，或任何路徑結束，都要寫 .done，等待的一方才不會永遠等。
# 放背景再 wait：bash 在前景子程序結束前不會跑 trap，wait 才能被訊號打斷。
# stdin 接 /dev/null、stdout／stderr 寫進檔：背景程序群組不該再去讀呼叫端的終端。
child=""
finish() {
  local code="$1"
  if [ ! -f "$out.done" ]; then
    echo "$code" >"$out.done"
  fi
}
on_signal() {
  local code="$1"
  trap - TERM INT HUP EXIT
  if [ -n "$child" ]; then
    kill -TERM "$child" 2>/dev/null || true
    wait "$child" 2>/dev/null || true
  fi
  echo "$code" >"$out.done"
  exit "$code"
}
trap 'on_signal 143' TERM
trap 'on_signal 130' INT
trap 'on_signal 129' HUP
trap 'finish $?' EXIT

rm -f "$out.done"
status=0
# ${awake[@]+...}：沒有 caffeinate 時陣列是空的，macOS 內建 bash 3.2 在 set -u 下直接展開會報錯。
"${limit[@]}" ${awake[@]+"${awake[@]}"} "${cmd[@]}" </dev/null >"$out" 2>"$out.err" &
child=$!
wait "$child" || status=$?
echo "$status" >"$out.done"
exit "$status"
