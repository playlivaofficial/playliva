import { lstat, realpath, rm } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

/** Validate the real path before recursively removing a worker-owned attempt. */
export async function cleanAttempt(root, target) {
  const resolvedRoot = await realpath(resolve(root))
  const resolvedTarget = await realpath(resolve(target))
  const child = relative(resolvedRoot, resolvedTarget)
  if (!child || isAbsolute(child) || child.startsWith(`..${sep}`) || child === '..' || child.split(sep).length !== 2) {
    throw new Error('Social worker scratch path is outside the attempt boundary.')
  }
  if ((await lstat(target)).isSymbolicLink()) throw new Error('Social worker scratch cannot be a symbolic link.')
  await rm(resolvedTarget, { recursive: true, force: true })
}
