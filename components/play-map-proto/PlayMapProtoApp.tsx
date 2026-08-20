"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  PROTO_CONTAINER_PRESETS,
  PROTO_VARIANTS,
  computeProtoMetrics,
  formatProtoMetricsReport,
  type NamedRect,
  type ProtoMapSample,
  type ProtoMetrics,
  type ProtoVariant,
} from "@/lib/play-map-proto-metrics";
import ProtoCityGrid from "./ProtoCityGrid";
import styles from "./PlayMapProtoApp.module.css";

const ProtoNationalMap = dynamic(() => import("./ProtoNationalMap"), {
  ssr: false,
  loading: () => (
    <p className={styles.placeholder} role="status">
      地圖載入中…
    </p>
  ),
});

export type PlayMapProtoAppProps = {
  /** 測試用：與畫面共用同一個選定縣市 handler。 */
  onSelectCity?: (next: string | null) => void;
};

const VARIANT_LABEL: Record<ProtoVariant, string> = {
  A: "A 現役 city cluster",
  B: "B 縣市卡片",
  C2: "C2 修好的 city marker",
};

function emptyMetrics(variant: ProtoVariant, presetId: (typeof PROTO_CONTAINER_PRESETS)[number]["id"]): ProtoMetrics {
  const preset = PROTO_CONTAINER_PRESETS.find((row) => row.id === presetId)!;
  return computeProtoMetrics({
    variant,
    preset,
    items: [],
  });
}

export default function PlayMapProtoApp({
  onSelectCity: onSelectCityProp,
}: PlayMapProtoAppProps) {
  const [variant, setVariant] = useState<ProtoVariant>("A");
  const [containerId, setContainerId] =
    useState<(typeof PROTO_CONTAINER_PRESETS)[number]["id"]>("mobile");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [entranceItems, setEntranceItems] = useState<readonly NamedRect[]>(
    [],
  );
  const [westEdge, setWestEdge] = useState<number | null>(null);
  const [c2Unsolved, setC2Unsolved] = useState<readonly string[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const preset = useMemo(
    () => PROTO_CONTAINER_PRESETS.find((row) => row.id === containerId)!,
    [containerId],
  );

  const handleSelectCity = useCallback(
    (next: string | null) => {
      setSelectedCity(next);
      onSelectCityProp?.(next);
    },
    [onSelectCityProp],
  );

  const handleSample = useCallback((sample: ProtoMapSample) => {
    setEntranceItems(sample.items);
    setWestEdge(sample.westEdge);
    setC2Unsolved(sample.c2Unsolved);
  }, []);

  const selectedPlaces = useMemo(
    () =>
      selectedCity
        ? listPlaygrounds().filter((place) => place.city === selectedCity)
        : [],
    [selectedCity],
  );

  const metrics = useMemo(() => {
    if (selectedCity) {
      return emptyMetrics(variant, containerId);
    }
    return computeProtoMetrics({
      variant,
      preset,
      items: entranceItems,
      westEdge,
      c2Unsolved,
    });
  }, [
    containerId,
    c2Unsolved,
    entranceItems,
    preset,
    selectedCity,
    variant,
    westEdge,
  ]);

  const report = formatProtoMetricsReport(metrics);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }, [report]);

  return (
    <div className={styles.app}>
      <div className={styles.controls} role="group" aria-label="prototype 切換">
        <div className={styles.controlRow}>
          <span className={styles.controlLabel} id="proto-variant-label">
            全國層呈現
          </span>
          <div
            className={styles.segment}
            role="radiogroup"
            aria-labelledby="proto-variant-label"
          >
            {PROTO_VARIANTS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={variant === id}
                className={styles.segmentButton}
                onClick={() => {
                  setVariant(id);
                  setEntranceItems([]);
                  setWestEdge(null);
                  setC2Unsolved([]);
                  setCopyState("idle");
                }}
              >
                {VARIANT_LABEL[id]}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel} id="proto-size-label">
            容器尺寸
          </span>
          <div
            className={styles.segment}
            role="radiogroup"
            aria-labelledby="proto-size-label"
          >
            {PROTO_CONTAINER_PRESETS.map((row) => (
              <button
                key={row.id}
                type="button"
                role="radio"
                aria-checked={containerId === row.id}
                className={styles.segmentButton}
                onClick={() => {
                  setContainerId(row.id);
                  setEntranceItems([]);
                  setWestEdge(null);
                  setCopyState("idle");
                }}
              >
                {row.label} {row.width}×{row.height}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.stage}>
        <div
          className={styles.viewport}
          data-testid="proto-viewport"
          data-proto-variant={variant}
          style={{ width: preset.width, height: preset.height }}
        >
          {selectedCity ? (
            <section className={styles.selected} aria-live="polite">
              <p className={styles.selectedLead}>已選定：{selectedCity}</p>
              <p className={styles.selectedNote}>
                三個 variant 選定後都進入同一畫面。Phase 2 只比較全國層呈現。
              </p>
              <ul className={styles.selectedList}>
                {selectedPlaces.map((place) => (
                  <li key={place.id}>{place.name}</li>
                ))}
              </ul>
              <button
                type="button"
                className={styles.reset}
                onClick={() => handleSelectCity(null)}
              >
                清除選定
              </button>
            </section>
          ) : variant === "B" ? (
            <ProtoCityGrid
              key={`${preset.id}-B`}
              onSelectCity={handleSelectCity}
              onSample={handleSample}
            />
          ) : (
            <ProtoNationalMap
              key={`${preset.id}-${variant}`}
              mode={variant}
              onSelectCity={handleSelectCity}
              onSample={handleSample}
            />
          )}
        </div>
      </div>

      <section
        className={styles.panel}
        aria-labelledby="proto-metrics-heading"
      >
        <div className={styles.panelHead}>
          <h2 id="proto-metrics-heading" className={styles.panelTitle}>
            量測面板
          </h2>
          <button
            type="button"
            className={styles.copy}
            onClick={() => void handleCopy()}
          >
            複製指標
          </button>
        </div>
        {copyState === "copied" ? (
          <p className={styles.copyStatus} role="status">
            已複製。
          </p>
        ) : null}
        {copyState === "failed" ? (
          <p className={styles.copyStatus} role="status">
            複製失敗，請手動選取下方文字。
          </p>
        ) : null}
        <pre className={styles.report} tabIndex={0}>
          {report}
        </pre>
      </section>
    </div>
  );
}
