/** D6：Ken Burns 僅在播放中且分頁可見時啟動。 */
export function shouldRunKenBurns(opts: {
  isPlaying: boolean;
  pageVisible: boolean;
  hasEnded: boolean;
  isLoading: boolean;
  prefersReducedMotion: boolean;
}): boolean {
  return (
    opts.isPlaying &&
    opts.pageVisible &&
    !opts.hasEnded &&
    !opts.isLoading &&
    !opts.prefersReducedMotion
  );
}
