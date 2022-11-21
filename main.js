/*
 * 비고
 * 1) UI 및 백엔드 로직 구분을 위해 MVC 패턴을 사용해서 구현했습니다.
 * 2) 추가로 잔돈 계산 알고리즘을 적용해 지속해서 돈을 투입할 때마다 잔돈 여부가 계산됩니다.
 * 3) 구매할 수 있는 음료가 없을 때나 고객이 "잔돈 반환" 버튼을 누르지 않는 한 잔돈이 자동으로 반환되지 않습니다.
 */

import { calculateBalance, calculateChange } from "./calculator.js";

/**
 * @function Model
 *
 * 데이터 핸들링을 수행하는 Model 클래스
 *
 * @param {Object} machineWalletInput 자판기의 현재 잔돈 현황 (default 천원, 전부 백원이라고 가정)
 * @param {Number} customerBalanceInput 고객 지갑에 있는 총 금액 (default 만원이라고 가정)
 */
const Model = (
  machineWalletInput = { 100: 10, 500: 0, 1000: 0 },
  customerBalanceInput = 10000
) => {
  // private variables
  let machineWallet = machineWalletInput;
  let displayBalance = 0;
  let customerBalance = customerBalanceInput; // customer has adequate coins

  /**
   * status 값 설명
   * 400 not enough money (고객)
   * 500 not enough money (오류 - 자판기)
   * 501 no change available (오류 - 잔돈부족)
   * 502 no quantity (오류 - 재고부족)
   * 200 OK (오류 - 정상)
   */
  const drinks = [
    { id: 1, name: "코카콜라", price: 700, quantity: 5, status: 500 },
    { id: 2, name: "오렌지 주스", price: 1200, quantity: 5, status: 500 },
    { id: 3, name: "커피", price: 500, quantity: 5, status: 500 },
    { id: 4, name: "물", price: 700, quantity: 5, status: 500 },
    { id: 5, name: "옥수수수염차", price: 1200, quantity: 5, status: 500 },
    { id: 6, name: "밀키스", price: 700, quantity: 5, status: 500 },
    { id: 7, name: "트래비", price: 1000, quantity: 5, status: 500 },
  ];
  const getDrinks = () => drinks;
  const minDrinkPrice = () =>
    // helper: returns minimum drink price
    drinks.reduce(
      (minimum, drink) => Math.min(minimum, drink.price),
      Number.POSITIVE_INFINITY
    );

  const getMachineWallet = () => calculateBalance(machineWallet);
  const getBalance = () => ({
    machineWallet: getMachineWallet(),
    displayBalance,
    customerBalance,
  });

  const checkChange = (changeAmount) => {
    // helper: checks if change is available for changeAmount
    if (changeAmount > getMachineWallet()) {
      return { status: 501 };
    }
    return calculateChange(machineWallet, changeAmount);
  };

  const toggleAvailableDrinks = () => {
    // helper: toggles drink status
    drinks.forEach((drink) => {
      if (drink.quantity === 0) {
        drink.status = 502;
      } else if (drink.price > displayBalance) {
        drink.status = 500;
      } else {
        drink.status = checkChange(displayBalance - drink.price).status;
      }
    });
  };

  const resetMachine = () => {
    // helper: reset machine internals
    displayBalance = 0;
    drinks.forEach((drink) => {
      if (drink.status !== 502) drink.status = 500;
    });
    toggleAvailableDrinks();
    console.log("machine reset!");
    console.log(drinks);
    console.log(`display balance: ${displayBalance}`);
    console.log(`machine balance: ${getMachineWallet()}`);
    console.log(machineWallet);
  };

  const insertMoney = (money) => {
    if (customerBalance < money) {
      console.log("Not enough money!");
      return { status: 400, messages: [`지갑에 돈이 부족합니다.`] };
    }
    machineWallet[money.toString()] += 1;
    displayBalance += money;
    customerBalance -= money;
    // console.log(`customer balance: ${customerBalance}`);
    // console.log(`display balance: ${displayBalance}`);
    // console.log(`machine balance: ${getMachineWallet()}`);

    toggleAvailableDrinks();
    return {
      status: 200,
      messages: [
        `<strong>${money.toLocaleString()}원</strong>이 투입되었습니다.`,
        `총투입 금액은 <strong>${displayBalance.toLocaleString()}원</strong>입니다.`,
        `당신의 지갑에는 <strong>${customerBalance.toLocaleString()}원</strong>이 남아 있습니다.`,
      ],
    };
  };

  const purchaseDrink = (id) => {
    const selectedDrink = drinks.find((drink) => drink.id === id);
    if (selectedDrink.status === 500) {
      return {
        status: 500,
        messages: ["투입 금액이 부족해서 선택한 음료를 구매할 수 없습니다."],
      };
    } else if (selectedDrink.status === 501) {
      return {
        status: 501,
        messages: [
          "자판기에 잔돈이 부족해서 선택한 음료를 구매할 수 없습니다.",
        ],
      };
    } else if (selectedDrink.status === 502) {
      return {
        status: 502,
        messages: [
          `선택한 음료(<strong>${selectedDrink.name}</strong>) 재고가 없습니다.`,
        ],
      };
    }

    displayBalance -= selectedDrink.price;
    selectedDrink.quantity -= 1;
    toggleAvailableDrinks();
    console.log(`display balance: ${displayBalance}`);
    console.log(`machine balance: ${getMachineWallet()}`);
    if (displayBalance < minDrinkPrice()) {
      // nothing to buy
      console.log("nothing to buy!");
      console.log(`display balance: ${displayBalance}`);
      console.log(`machine balance: ${getMachineWallet()}`);
      const change = returnChange().change;
      const changeMessage =
        change > 0
          ? `잔돈 <strong>${change.toLocaleString()}원</strong>이 나옵니다.`
          : "반환 할 잔돈이 없습니다.";
      return {
        status: 200,
        messages: [
          `선택한 음료(<strong>${selectedDrink.name}</strong>)가 나왔습니다.`,
          changeMessage,
        ],
      };
    }
    return {
      status: 200,
      messages: [
        `선택한 음료(<strong>${selectedDrink.name}</strong>)가 나왔습니다.`,
      ],
    };
  };

  const returnChange = () => {
    // 1. user presses returnChange
    // 2. if user buys drink, and cannot buy anymore returnChange
    const changeObj = checkChange(displayBalance);
    const totalChange = calculateBalance(changeObj.change);
    machineWallet = changeObj.wallet;
    customerBalance += totalChange;
    console.log(`thank you! your change is ${totalChange}`);
    resetMachine();
    console.log(`customer balance: ${customerBalance}`);
    return {
      status: 200,
      change: totalChange,
      messages: [
        `전체 금액(<strong>${totalChange.toLocaleString()}원</strong>)이 반환 되었습니다.`,
      ],
    };
  };

  return {
    getBalance,
    getDrinks,
    insertMoney,
    purchaseDrink,
    returnChange,
  };
};

/**
 * @function View
 *
 * 자판기가 보여주는 View를 핸들링하는 클래스
 */
const View = () => {
  const drinksContainer = document.querySelector(".drinks");
  const coinsContainer = document.querySelector(".coins");
  const outputContainer = document.querySelector(".output");
  const returnButton = document.querySelector(".return");
  const machineWallet = document.querySelector(".machine-wallet");
  const displayBalance = document.querySelector(".display-balance");
  const customerBalance = document.querySelector(".customer-balance");

  const renderDrinks = (drinkList) => {
    drinksContainer.replaceChildren();
    console.log(drinkList);
    for (let drink of drinkList) {
      const drinkElement = document.createElement("div");
      let extraText = "";
      drinksContainer.appendChild(drinkElement);
      drinkElement.className = "drink";
      drinkElement.id = drink.id;
      if (drink.status === 501) {
        extraText = "(잔돈부족)";
      } else if (drink.status === 502) {
        extraText = "(재고부족)";
      }
      drinkElement.innerHTML = [
        `<div id="img-${drink.id}" class="drink-img"></div>`,
        `<button class="drink-button">
          <p>${drink.name}</p>
          <p>${drink.price.toLocaleString()}원</p>
        </button>`,
        `<p class="small-font">재고수 [${drink.quantity}개]</p>`,
        `<p style="color:red" class="small-font">${extraText}</p>`, // error message
      ].join("");

      drinkElement.childNodes[1].style.backgroundColor =
        drink.status === 200 ? "#23DC3D" : "buttonface";
    }
    // console.log(drinkList);
  };

  const renderMoney = (balances) => {
    machineWallet.innerText = `₩${balances.machineWallet.toLocaleString()}`;
    displayBalance.innerText = `₩${balances.displayBalance.toLocaleString()}`;
    customerBalance.innerText = `₩${balances.customerBalance.toLocaleString()}`;
  };

  const renderOutput = (output) => {
    outputContainer.replaceChildren();
    output.messages.forEach((message) => {
      const outputElement = document.createElement("p");
      outputContainer.appendChild(outputElement);
      outputElement.innerHTML = message;
    });
  };

  const bindInsertMoney = (handler) => {
    coinsContainer.addEventListener("click", (e) => {
      e.preventDefault();
      const insertAmount = parseInt(e.target.value);
      if (e.target.className === "coin") {
        console.log(`Inserted ${insertAmount}`);
        const output = handler(insertAmount);
        renderOutput(output);
      }
    });
  };

  const bindPurchaseDrink = (handler) => {
    drinksContainer.addEventListener("click", (e) => {
      e.preventDefault();
      const id =
        e.target.parentElement.parentElement.id + e.target.parentElement.id;
      if (id.trim() != "") {
        const output = handler(parseInt(id));
        renderOutput(output);
      }
    });
  };

  const bindReturnChange = (handler) => {
    returnButton.addEventListener("click", (e) => {
      e.preventDefault();
      const output = handler();
      renderOutput(output);
    });
  };

  return {
    bindInsertMoney,
    bindPurchaseDrink,
    bindReturnChange,
    renderDrinks,
    renderMoney,
  };
};

/**
 * @function Controller
 *
 * 모델과 뷰를 링크해주는 클래스
 *
 * @param {function} model
 * @param {function} view
 */
const Controller = (model, view) => {
  const renderDrinks = () => {
    view.renderDrinks(model.getDrinks());
    view.renderMoney(model.getBalance());
  };

  const insertMoney = (money) => {
    const output = model.insertMoney(money);
    renderDrinks();
    return output;
  };

  const purchaseDrink = (id) => {
    const output = model.purchaseDrink(id);
    renderDrinks();
    return output;
  };

  const returnChange = () => {
    const output = model.returnChange();
    renderDrinks();
    return output;
  };

  renderDrinks(); // initial run
  view.bindInsertMoney(insertMoney);
  view.bindPurchaseDrink(purchaseDrink);
  view.bindReturnChange(returnChange);
};

window.addEventListener("load", () => {
  // run MVC once window is loaded
  const app = Controller(Model(), View());
});
