/* eslint-disable no-promise-executor-return */
export function sleep(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
