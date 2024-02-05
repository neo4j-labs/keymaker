const PhaseMap = {
    CypherDiscoveryPhase: "CypherDiscoveryPhase",
    CypherExcludePhase: "CypherExcludePhase",
    CypherBoostPhase: "CypherBoostPhase",
    CypherDiversityPhase: "CypherDiversityPhase",
    CypherCollectionPhase: "CypherCollectionPhase",
    CypherWritePhase: "CypherWritePhase",
    GDSCreatePhase: "GDSCreatePhase",
    GDSWritePhase: "GDSWritePhase",
    GDSDropPhase: "GDSDropPhase"
}

export const PhaseSet = new Set(Object.keys(PhaseMap));