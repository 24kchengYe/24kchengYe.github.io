const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const sourceRoot = process.argv[2];
if (!sourceRoot || !fs.statSync(sourceRoot).isDirectory()) throw new Error('Pass the local projectTest_1103 evidence directory');
const evidence = [];
const read = relative => {
  const bytes = fs.readFileSync(path.join(sourceRoot, relative));
  evidence.push({ path:relative, sha256:createHash('sha256').update(bytes).digest('hex') });
  return bytes.toString('utf8');
};
const json = relative => JSON.parse(read(relative));
const rows = relative => read(relative).trim().split('\n').map(line => JSON.parse(line));
const runs = 'data/spec/lite0-1/runs/';
const repair = runs + '2026-09-23_building50_G_repeat_K_prompt_v01/K/judgefix/artifacts/cases/41/';
const fixState = json(repair + 'case_states/non_table_fix_visit_02.json');
assert.equal(fixState.rounds[0].round, 1);
assert.equal(fixState.rounds[0].committed, true);
assert.equal(fixState.rounds[0].candidate_search.selected_index, 2);
assert.match(JSON.stringify(fixState.judge_before), /需求未说明其业务写入职责/);
const before = read(repair + 'docs/non_table_fix_visit_02/round_01_input.json');
const after = read(repair + 'docs/non_table_fix_visit_02/round_01_candidate_02_output.json');
assert.match(before, /管理员[\s\S]{0,240}数据表权限：可编辑/);
assert.match(after, /管理员[\s\S]{0,240}数据表权限：仅可阅读/);
for (const [group, permission] of [['G', 'edit'], ['K', 'read']]) {
  const code = rows(runs + `2026-09-23_building50_GK_codeagent_e2e_v01/${group}/output/codeagent_results.jsonl`).find(row => row.id === '41');
  assert.equal(code.status, 'passed');
  const administrator = code.finalCode.split("roles.createRole('门店巡检系统管理员'")[1].split("roles.createRole(")[0];
  assert.equal([...administrator.matchAll(/\.setTablePermission\(/g)].length, 7);
  assert.equal([...administrator.matchAll(new RegExp(`\\.perm\\('${permission}'\\)`, 'g'))].length, 7);
}
const repairReport = read(runs + '2026-09-23_building50_GK_codeagent_e2e_v01/analysis/2026-09-24_building50_G_repeat_vs_K_deep_analysis.md');
const case41 = repairReport.split('### Case 41 —')[1].split('### Case 42')[0];
assert.match(case41, /pre_release_semantic_rejudge_failed/);
assert.match(case41, /hard_majority_budget_exhausted/);
assert.match(case41, /通过 \/ 10分.*失败 \/ 9.5分/);

const generationPaths = [
  ['2026-10-10_q2_building_0_7_top50_v01/e2e_formal', '2026-10-10_q2_building_0_7_top50_v01/e2e_formal', '已面试', 5.5, false],
  ['2026-10-09_sft_ptml9_building_0_7_top50_v03/e2e', '2026-10-10_sft_ptml9_building_0_7_top50_v04/e2e', '已安排面试', 10, true]
];
for (const [traceRoot, judgeRoot, status, score, passed] of generationPaths) {
  const trajectory = json(runs + traceRoot + '/codeagent/attempt_0001/cases/link50_007/trajectory.json');
  const userInput = trajectory.messages.filter(message => message.role === 'user').map(message => message.content).join('\n');
  const code = trajectory.rounds.flatMap(round => round.toolCalls || []).map(call => call.arguments).join('\n');
  assert(userInput.includes(status));
  assert(code.includes(`.where(['简历状态', 'eq', '${status}'])`));
  if (status === '已面试') assert.match(userInput, /待面试候选人视图[^\n]+已面试/);
  const result = json(runs + judgeRoot + '/judge/attempt_0001/report.json').cases.find(row => row.id === 'link50_007');
  assert.equal(result.overallScore, score);
  assert.equal(result.passed, passed);
}

const judgeRuns = 'data/judge_infra/spec/runs/';
const unit = 'sft-v46-sample-dashboard-04911949078c8c229bc5';
const sft = rows(judgeRuns + 'SFT-v47-v49_2026-09-07_BQ2504-JF_R17_three_model_eval/predictions_sft_v48_cumulative_mid.jsonl').find(row => row.review_unit_id === unit);
const reinforcement = rows(judgeRuns + 'OPCD_2026-10-08_current_modelhub_eval_v01/outputs/rlv48_r17.predictions.jsonl').find(row => row.review_unit_id === unit);
assert.deepEqual(sft.request_messages, reinforcement.request_messages);
assert.deepEqual(sft.ground_truth, reinforcement.ground_truth);
const issues = value => value.category_reviews.flatMap(category => category.issues);
const modes = value => [...new Set(issues(value).map(issue => issue.rubric_id + '/' + issue.mode))];
const referenceModes = modes(sft.ground_truth);
const modeScores = [sft, reinforcement].map(row => {
  assert.equal(row.prediction.verdict, 'fail');
  assert.equal(issues(row.prediction).length, 2);
  const predictedModes = modes(row.prediction);
  const truePositives = predictedModes.filter(mode => referenceModes.includes(mode)).length;
  return 2 * truePositives / (predictedModes.length + referenceModes.length);
});
assert.deepEqual(modeScores, [0, 1]);
assert.equal(issues(sft.ground_truth).length, 2);
assert.equal(referenceModes.length, 1);
assert(referenceModes[0].endsWith('/invalid_dashboard_source_reference'));
assert(modes(sft.prediction)[0].endsWith('/dashboard_business_filter_mismatch'));

const output = path.join(__dirname, '../_preview/research-evidence-audit.json');
fs.mkdirSync(path.dirname(output), { recursive:true });
fs.writeFileSync(output, JSON.stringify({ checked:true, caseIds:['41','link50_007',unit], e2eScoreDisplayMultiplier:10, modeScores, artifacts:evidence }, null, 2) + '\n');
console.log(`Verified three recorded cases against ${evidence.length} source artifacts; no model calls.`);
