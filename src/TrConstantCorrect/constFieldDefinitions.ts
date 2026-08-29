/**
 * システム定数メンテナンスで選択可能な定数項目
 */
export type ConstFieldDefinition = {
  constField: string;
  label: string;
};

export const TR_CONSTANT_FIELD_DEFINITIONS: ConstFieldDefinition[] = [
  { constField: "grade", label: "有機区分" },
  { constField: "lotno", label: "出物" },
  { constField: "producer", label: "生産者" },
  { constField: "purchase", label: "仕入先" },
  { constField: "resale", label: "転売先" },
  { constField: "target_plan1", label: "予定用途1" },
  { constField: "target_plan2", label: "予定用途2" },
  { constField: "target_plan3", label: "予定用途3" },
  { constField: "target_plan4", label: "予定用途4" },
  { constField: "target_plan5", label: "予定用途5" },
  { constField: "target_plan6", label: "予定用途6" },
  { constField: "target1", label: "用途1" },
  { constField: "target2", label: "用途2" },
  { constField: "target3", label: "用途3" },
  { constField: "target4", label: "用途4" },
  { constField: "target5", label: "用途5" },
  { constField: "target6", label: "用途6" },
  { constField: "target7", label: "用途7" },
  { constField: "tea_life", label: "茶期" },
  { constField: "tea_rank", label: "格付" },
  { constField: "tea_type", label: "品柄" },
  { constField: "transfer", label: "移動先" },
  { constField: "variety", label: "茶種" }
];

export function constFieldLabel(constField: string): string {
  const hit = TR_CONSTANT_FIELD_DEFINITIONS.find((d) => d.constField === constField);
  return hit?.label ?? constField;
}
