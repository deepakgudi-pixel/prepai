import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Using built-in PDF fonts for reliability (no network requests)
// Times-Roman = editorial serif display, Helvetica = clean sans body

const cream = "#EAE8E3";
const dark = "#111111";
const mid = "#555555";
const light = "#999999";
const rule = "#D5D3CE";

const s = StyleSheet.create({
  page: {
    backgroundColor: cream,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    color: dark,
  },

  // Header band
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: rule,
  },
  brand: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: light,
  },
  meta: {
    fontSize: 7,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: light,
  },

  // Title block
  eyebrow: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: light,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Times-Roman",
    fontSize: 26,
    lineHeight: 1.1,
    color: dark,
    marginBottom: 12,
  },
  description: {
    fontSize: 10.5,
    lineHeight: 1.7,
    color: mid,
    maxWidth: 380,
    marginBottom: 28,
  },

  // Meta pills row
  pillRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 36,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: rule,
    borderRadius: 50,
    fontSize: 7,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: mid,
  },

  // Divider
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: rule,
    marginBottom: 28,
  },

  // Two-column body
  body: {
    flexDirection: "row",
    gap: 36,
  },
  colLeft: {
    width: "38%",
  },
  colRight: {
    width: "62%",
  },

  // Section heading
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: light,
    marginBottom: 14,
  },

  // Ingredients
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0DDD8",
  },
  ingredientName: {
    fontSize: 9.5,
    color: dark,
    maxWidth: "65%",
  },
  ingredientAmount: {
    fontSize: 9,
    color: light,
    textAlign: "right",
  },

  // Instructions
  stepBlock: {
    marginBottom: 18,
  },
  stepNumber: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: light,
    marginBottom: 4,
  },
  stepTitle: {
    fontFamily: "Times-Roman",
    fontSize: 13,
    color: dark,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 9.5,
    lineHeight: 1.65,
    color: mid,
  },
  stepTip: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Oblique",
    color: light,
    marginTop: 4,
  },

  // Tips section
  tipItem: {
    fontSize: 9,
    lineHeight: 1.6,
    color: mid,
    marginBottom: 6,
    paddingLeft: 10,
  },

  // Nutrition bar
  nutritionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: rule,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontFamily: "Times-Roman",
    fontSize: 18,
    color: dark,
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 7,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: light,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: rule,
  },
  footerText: {
    fontSize: 7,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: light,
  },
});

export function RecipePDF({ recipe }) {
  const totalTime = (parseInt(recipe.prepTime) || 0) + (parseInt(recipe.cookTime) || 0);
  const nutrition = recipe.nutrition || {};

  // Prevent double units like "5gg" — only append unit if value doesn't already end with it
  const formatUnit = (value, unit) => {
    if (!value) return "";
    const str = String(value);
    if (str.toLowerCase().endsWith(unit.toLowerCase())) return str;
    return `${str}${unit}`;
  };

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerBar}>
          <Text style={s.brand}>PrepAI</Text>
          <Text style={s.meta}>Recipe Card</Text>
        </View>

        {/* Title Block */}
        <Text style={s.eyebrow}>
          {recipe.cuisine || "Recipe"} · {recipe.category || "Meal"}
        </Text>
        <Text style={s.title}>{recipe.title}</Text>
        <Text style={s.description}>{recipe.description}</Text>

        {/* Meta Pills */}
        <View style={s.pillRow}>
          {totalTime > 0 && <Text style={s.pill}>{totalTime} mins</Text>}
          {recipe.servings && <Text style={s.pill}>{recipe.servings} servings</Text>}
          {recipe.prepTime > 0 && <Text style={s.pill}>Prep {recipe.prepTime}m</Text>}
          {recipe.cookTime > 0 && <Text style={s.pill}>Cook {recipe.cookTime}m</Text>}
        </View>

        <View style={s.divider} />

        {/* Two-Column Layout */}
        <View style={s.body}>
          {/* Left: Ingredients */}
          <View style={s.colLeft}>
            <Text style={s.sectionLabel}>Ingredients</Text>
            {(recipe.ingredients || []).map((ing, i) => (
              <View key={i} style={s.ingredientRow}>
                <Text style={s.ingredientName}>{ing.item}</Text>
                <Text style={s.ingredientAmount}>{ing.amount}</Text>
              </View>
            ))}
          </View>

          {/* Right: Instructions */}
          <View style={s.colRight}>
            <Text style={s.sectionLabel}>Method</Text>
            {(recipe.instructions || []).map((step) => (
              <View key={step.step} style={s.stepBlock}>
                <Text style={s.stepNumber}>Step {step.step}</Text>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepText}>{step.instruction}</Text>
                {step.tip && <Text style={s.stepTip}>Tip: {step.tip}</Text>}
              </View>
            ))}

            {/* Tips */}
            {recipe.tips?.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={s.sectionLabel}>Chef&apos;s Notes</Text>
                {recipe.tips.map((tip, i) => (
                  <Text key={i} style={s.tipItem}>— {tip}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Nutrition Bar */}
        {Object.keys(nutrition).length > 0 && (
          <View style={s.nutritionBar} wrap={false}>
            {nutrition.calories && (
              <View style={s.nutritionItem}>
                <Text style={s.nutritionValue}>{nutrition.calories}</Text>
                <Text style={s.nutritionLabel}>Calories</Text>
              </View>
            )}
            {nutrition.protein && (
              <View style={s.nutritionItem}>
                <Text style={s.nutritionValue}>{formatUnit(nutrition.protein, "g")}</Text>
                <Text style={s.nutritionLabel}>Protein</Text>
              </View>
            )}
            {nutrition.carbs && (
              <View style={s.nutritionItem}>
                <Text style={s.nutritionValue}>{formatUnit(nutrition.carbs, "g")}</Text>
                <Text style={s.nutritionLabel}>Carbs</Text>
              </View>
            )}
            {nutrition.fat && (
              <View style={s.nutritionItem}>
                <Text style={s.nutritionValue}>{formatUnit(nutrition.fat, "g")}</Text>
                <Text style={s.nutritionLabel}>Fat</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>PrepAI — Pantry Intelligence</Text>
          <Text style={s.footerText}>prepai.app</Text>
        </View>
      </Page>
    </Document>
  );
}