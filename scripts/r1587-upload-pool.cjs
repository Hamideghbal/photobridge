'use strict';
/**
 * Drain a bounded number of independent file uploads.
 * Wait for EVERY started request to settle before failing, so callers can safely
 * delete a draft without racing in-flight /complete API calls.
 * Keep the first original error and stop scheduling any NEW jobs on failure.
 */
async function PB1587runUploadPool(jobs, concurrency, uploadOne) {
  if (!Array.isArray(jobs)) throw new TypeError('jobs must be an array');
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new RangeError('invalid upload concurrency');
  if (typeof uploadOne !== 'function') throw new TypeError('uploadOne must be a function');
  let next = 0;
  let firstError = null;
  const worker = async () => {
    while (next < jobs.length && !firstError) {
      const job = jobs[next++];
      try { await uploadOne(job); }
      catch (error) { if (!firstError) firstError = error; }
    }
  };
  await Promise.all(Array.from({length: Math.min(concurrency, jobs.length)}, worker));
  if (firstError) throw firstError;
}
module.exports = {PB1587runUploadPool};
