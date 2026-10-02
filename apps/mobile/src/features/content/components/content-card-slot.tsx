import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { fetchContentCards, recordContentEvent } from "../api/content-api";
import { useOpenLink } from "../hooks/use-open-link";
import type { CardScreen, ContentCard } from "../types";
import { InAppCard } from "./in-app-card";

/**
 * Where in-app cards from the Content library appear on a screen. Renders nothing when there are
 * none. Each card counts one impression per visit, which is what the frequency cap in the console uses.
 */
export function ContentCardSlot({ screen }: { screen: CardScreen }) {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const counted = useRef(new Set<string>());
  const openLink = useOpenLink();

  const load = useCallback(() => {
    let cancelled = false;
    counted.current.clear();
    fetchContentCards(screen)
      .then((list) => {
        if (cancelled) return;
        setCards(list);
        for (const card of list) {
          recordContentEvent(card.id, "impression", card.variant);
          counted.current.add(card.id);
        }
      })
      .catch(() => {
        // Cards are optional: a failed request just means none are shown.
      });
    return () => {
      cancelled = true;
    };
  }, [screen]);

  useFocusEffect(load);

  if (cards.length === 0) return null;

  return (
    <View style={styles.list}>
      {cards.map((card) => (
        <InAppCard
          key={card.id}
          card={card}
          onOpen={() => {
            recordContentEvent(card.id, "click", card.variant);
            if (card.deepLink) openLink(card.deepLink);
          }}
          onDismiss={() => {
            recordContentEvent(card.id, "dismiss", card.variant);
            setCards((cur) => cur.filter((c) => c.id !== card.id));
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ list: { gap: 12 } });
