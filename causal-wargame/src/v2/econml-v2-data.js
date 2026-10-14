// CAMPUS V2 ONLY: never read the banking V1 EconML outputs.
import benchmark from './econml-v2-verified.json' with {type:'json'}
const methods=['t_learner','dr_learner','causal_forest']
const finite=x=>typeof x==='number'&&Number.isFinite(x)
export const econmlV2Ready=(
  benchmark.schema_version===1&&benchmark.status==='verified'&&
  benchmark.provenance?.engine==='EconML'&&
  benchmark.provenance?.dataset==='campus-academic-experiment-v2'&&
  benchmark.provenance?.n===2000&&benchmark.provenance?.train_rows===1500&&
  benchmark.provenance?.holdout_rows===500&&
  benchmark.provenance?.data_sha256==='2dbe8a142048b55587874d8e21477ace033ef2efdf93566de9e738f46e12ce2e'&&
  Array.isArray(benchmark.segments)&&benchmark.segments.length===5&&
  benchmark.segments.every(s=>methods.every(m=>finite(s[m])))&&
  methods.every(m=>finite(benchmark.metrics?.[m]?.cate_rmse_points))
)
export const verifiedV2EconML=econmlV2Ready?benchmark:null
