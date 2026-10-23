// Build-time only: no JavaScript or external math service is needed by readers.
const fs = require('fs');
const katex = require(process.argv[2]);
const equations = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const macros = {'\\*':'*', '\\mbox':'\\text{#1}', '\\textsc':'\\text{#1}', '\\mathbbm':'\\mathbb{#1}', '\\centernot':'\\not'};
const output = equations.map(row => {
  const tex=row.tex.replace(/(\\frac\{\\#\\mathrm\{(?:Successes|NewlyRepaired)\}\})\s*(\\mathrm\{(?:TotalTokens|RepairTokens)\}\})/g,'$1{$2');
  try {
    return {repair:tex!==row.tex?tex:null,html:katex.renderToString(tex,{displayMode:row.display,output:'mathml',throwOnError:true,trust:false,strict:'ignore',maxExpand:1000,macros})};
  } catch (error) { return {error:error.message}; }
});
fs.writeFileSync(process.argv[4], JSON.stringify(output));
