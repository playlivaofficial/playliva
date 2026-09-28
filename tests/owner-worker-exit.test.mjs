import test from 'node:test'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'

test('finished workers flush their report and release the process despite leftover renderer handles', () => {
  const moduleUrl=new URL('../scripts/owner/worker-exit.mjs',import.meta.url).href
  for(const code of [0,1]){
    const result=spawnSync(process.execPath,['--input-type=module','-e',`import {finishWorker} from ${JSON.stringify(moduleUrl)};setInterval(()=>{},1000);finishWorker({completed:2,failures:${code},autoPublish:false},${code})`],{encoding:'utf8',timeout:10000,windowsHide:true})
    assert.equal(result.error,undefined)
    assert.equal(result.status,code)
    assert.deepEqual(JSON.parse(result.stdout),{completed:2,failures:code,autoPublish:false})
    assert.equal(result.stderr,'')
  }
})
