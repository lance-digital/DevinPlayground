import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import jscodeshift from 'jscodeshift';

// 現在のファイルのディレクトリパスを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ディレクトリ内のすべてのTSファイルを再帰的に検索
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (/\.(ts|tsx|vue)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 関数呼び出しを検出
function analyzeFunctionCalls(source, filePath) {
  try {
    const ast = jscodeshift(source);
    const functionCalls = [];
    
    // 関数定義を収集
    const functionDefinitions = [];
    ast.find(jscodeshift.FunctionDeclaration).forEach(path => {
      if (path.node.id) {
        functionDefinitions.push({
          name: path.node.id.name,
          file: filePath,
          type: 'function'
        });
      }
    });
    
    // メソッド定義も収集
    ast.find(jscodeshift.MethodDefinition).forEach(path => {
      functionDefinitions.push({
        name: path.node.key.name,
        file: filePath,
        type: 'method'
      });
    });
    
    // 関数呼び出しを検出
    ast.find(jscodeshift.CallExpression).forEach(path => {
      if (path.node.callee.type === 'Identifier') {
        functionCalls.push({
          caller: path.parentPath?.parentPath?.value?.id?.name || 'anonymous',
          callee: path.node.callee.name,
          file: filePath
        });
      }
    });
    
    return { functionDefinitions, functionCalls };
  } catch (err) {
    console.error(`Error analyzing ast in ${filePath}: ${err.message}`);
    return { functionDefinitions: [], functionCalls: [] };
  }
}

// メイン処理
const srcDir = join(__dirname, 'src');
console.log(`Searching for TypeScript files in: ${srcDir}`);

try {
  const files = findTsFiles(srcDir);
  console.log(`Found ${files.length} files to analyze`);
  
  if (files.length === 0) {
    console.error(`No .ts, .tsx, or .vue files found in ${srcDir}`);
    process.exit(1);
  }

  const results = { definitions: [], calls: [] };

  files.forEach(file => {
    try {
      console.log(`Analyzing: ${file}`);
      const source = fs.readFileSync(file, 'utf-8');
      const analysis = analyzeFunctionCalls(source, file);
      results.definitions = [...results.definitions, ...analysis.functionDefinitions];
      results.calls = [...results.calls, ...analysis.functionCalls];
    } catch (err) {
      console.error(`Error analyzing ${file}: ${err.message}`);
    }
  });

  // 結果をJSONファイルに出力
  fs.writeFileSync('function-dependencies.json', JSON.stringify(results, null, 2));
  console.log(`Function dependency analysis complete. Found ${results.definitions.length} function definitions and ${results.calls.length} function calls.`);
  console.log('Results written to function-dependencies.json');
} catch (err) {
  console.error(`Fatal error: ${err.message}`);
} 