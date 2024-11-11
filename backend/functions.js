// Helper function to get the reverse relation type
export function getReverseRelationType(relationType) {
  const reverseRelationMap = {
    Source: "Adaptation",
    Adaptation: "Source",
    Prequel: "Sequel",
    Sequel: "Prequel",
    Character: "Parent",
    Alternative: "Alternative",
    Contains: "Compilation",
    Compilation: "Contains",
    SideStory: "Parent",
    SpinOff: "Parent",
    Summary: "Parent",
    Other: "Parent",
  };

  return reverseRelationMap[relationType] || null;
}
