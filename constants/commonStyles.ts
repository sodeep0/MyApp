import { Colors, Shapes, Spacing, Typography, Shadows } from "./theme";

export const CommonStyles: Record<string, any> = {
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.Background,
  },

  stackHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },

  stackHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.WarmSand + "60",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  stackHeaderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },

  stackHeaderTitle: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    fontWeight: "700",
  },

  stackHeaderSubtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  listHeaderLeft: {
    flex: 1,
  },

  listHeaderTitle: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    fontWeight: "700",
  },

  listHeaderSubtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },

  listContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.md,
  },

  filterChipRowContainer: {
    marginBottom: Spacing.lg,
  },

  filterChipRowContent: {
    gap: Spacing.sm,
  },

  surfaceCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    ...Shadows.Card,
  },

  surfaceCardFlat: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
  },

  emptyStateCentered: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },

  emptyIconCircleMd: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },

  emptyIconCircleLg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },

  fabBase: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.FAB,
  },

  settingsMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  settingsMenuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle + "80",
  },

  settingsMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: Shapes.IconBg,
    justifyContent: "center",
    alignItems: "center",
  },

  settingsMenuLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    flex: 1,
  },

  settingsTrailingValue: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },

  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shapes.Chip,
    backgroundColor: Colors.WarmSand,
  },

  filterChipSelected: {
    backgroundColor: Colors.SoftSky,
  },

  filterChipLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  filterChipLabelSelected: {
    color: Colors.Surface,
  },

  formScrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
  },

  sectionLabel: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
  },

  sectionLabelSpaced: {
    marginTop: Spacing.lg,
  },

  sectionBlockSpaced: {
    marginTop: Spacing.lg,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.Background,
    borderColor: Colors.DustyTaupe,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },

  inputIcon: {
    marginRight: Spacing.sm,
  },

  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.Body1,
    color: Colors.TextPrimary,
  },

  textAreaWrapper: {
    alignItems: "flex-start",
  },

  textAreaIcon: {
    marginTop: Spacing.md,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  charCount: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    textAlign: "right",
    marginTop: 4,
  },

  ctaContainer: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
  },

  primaryCtaButton: {
    borderRadius: Shapes.Button,
    backgroundColor: Colors.SteelBlue,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  primaryCtaButtonDisabled: {
    opacity: 0.5,
  },

  primaryCtaText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.Surface,
    letterSpacing: 0.4,
  },

  primaryCtaTextDisabled: {
    color: Colors.Surface,
    opacity: 0.7,
  },

  floatingFab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.FAB,
    backgroundColor: Colors.TextPrimary,
  },
};
