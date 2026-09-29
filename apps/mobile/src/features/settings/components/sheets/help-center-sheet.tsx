import { ArrowRight, CaretDown, CaretUp, ChatCircle } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { SearchField } from "@/components/form/search-field";
import { colors, fonts, radius } from "@/constants/theme";
import { settingsApi } from "../../api/settings-api";
import type { Faq } from "../../types";

const SEARCH_DEBOUNCE_MS = 250;

export function HelpCenterSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Help center" gap={18} scrollable>
      <HelpContent />
    </BottomSheet>
  );
}

/** Search box, FAQ accordion, and a "chat with support" card. Mounted only while the sheet is open. */
function HelpContent() {
  const [query, setQuery] = useState("");
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      settingsApi.getFaqs(query).then((list) => {
        if (cancelled) return;
        setFaqs(list);
        // Open the first answer when the list first arrives.
        setOpenId((cur) => cur ?? list[0]?.id ?? null);
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <View style={styles.content}>
      <SearchField value={query} onChange={setQuery} placeholder="Search for help" />

      <View style={styles.list}>
        {faqs?.map((faq) => {
          const open = faq.id === openId;
          const Chevron = open ? CaretUp : CaretDown;
          return (
            <Pressable
              key={faq.id}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpenId(open ? null : faq.id)}
              style={styles.faq}
            >
              <View style={styles.faqHead}>
                <Text style={styles.question}>{faq.question}</Text>
                <Chevron size={16} color={colors.inkFaint} />
              </View>
              {open ? <Text style={styles.answer}>{faq.answer}</Text> : null}
            </Pressable>
          );
        })}
        {faqs && faqs.length === 0 ? <Text style={styles.empty}>No answers match your search.</Text> : null}
      </View>

      {/* TODO: open the support chat (or WhatsApp) once it exists. */}
      <Pressable accessibilityRole="button" style={styles.contact}>
        <View style={styles.contactIcon}>
          <ChatCircle size={18} color={colors.info} />
        </View>
        <View style={styles.contactText}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>Chat with our support team</Text>
        </View>
        <ArrowRight size={16} color={colors.info} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "stretch", gap: 18 },
  list: { gap: 10 },
  faq: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  faqHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  question: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  answer: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.inkMuted },
  empty: { textAlign: "center", fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted, paddingVertical: 16 },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.infoSoft,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: { flex: 1, gap: 1 },
  contactTitle: { fontFamily: fonts.bold, fontSize: 12, color: colors.info },
  contactSubtitle: { fontFamily: fonts.medium, fontSize: 11, color: colors.info },
});
