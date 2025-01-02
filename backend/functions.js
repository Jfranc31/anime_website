// Helper function to get the reverse relation type
export function getReverseRelationType(relationType) {
  const reverseRelationMap = {
    Source: "Adaptation",
    Adaptation: "Source",
    Prequel: "Sequel",
    Sequel: "Prequel",
    Parent: "Child",
    Child: "Parent",
    Alternative: "Alternative",
    Contains: "Compilation",
    Compilation: "Contains",
  };

  return reverseRelationMap[relationType] || null;
}
