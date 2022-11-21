/**
 * 지갑에 있는 모든 코인 및 지폐의 총합을 구함
 *
 * @param {object} wallet 지갑 객체
 * @returns {number} 지갑에 있는 코인 및 지폐의 총합
 */
function calculateBalance(wallet) {
  let total = 0;
  for (let key in wallet) {
    total += wallet[key] * parseInt(key);
  }
  return total;
}

/**
 * 지갑에 있는 잔돈 개수 및 반환해야 하는 잔돈 금액을 파라미터로 받아 잔돈이 충분한지 계산하고 반환
 * (Greedy Algorithm)
 *
 * @param {Object} wallet 지갑 객체
 * @param {Number} changeAmount 반환해야 하는 잔돈 금액
 * @returns {Object}
 *  {status: 200 (정상) / 501 (오류 - 잔돈없음)
 *   change: 계산 된 잔돈 금액
 *   wallet: }
 */
function calculateChange(wallet, changeAmount) {
  let currentIndex = 0;
  let options = Object.keys(wallet);
  const newWallet = { ...wallet };
  options.sort((a, b) => b - a);
  // run greedy change generator algorithm
  const change = {};
  while (changeAmount > 0 && currentIndex < options.length) {
    const optionAmount = parseInt(options[currentIndex]);
    if (newWallet[options[currentIndex]] > 0 && changeAmount >= optionAmount) {
      //   console.log(`${changeAmount} subtracted ${optionAmount}`);
      changeAmount -= optionAmount;
      newWallet[options[currentIndex]] -= 1;
      if (!(options[currentIndex] in change)) {
        change[options[currentIndex]] = 0; // initialize if not exists
      }
      change[options[currentIndex]] += 1;
    } else {
      currentIndex++;
    }
  }
  if (changeAmount !== 0) {
    return { status: 501 };
  } else {
    return { status: 200, change, wallet: newWallet };
  }
}

export { calculateBalance, calculateChange };
