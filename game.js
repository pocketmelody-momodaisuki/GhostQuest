(function () {
  "use strict";

  let currentScreenId = "screen-name";
  let currentShopType = null; // "item" or "weapon"
  let popupAction = null;
  let popupPayload = null;
  let isInBattle = false;
  let currentEnemy = null;
  let isBossBattle = false;

  const player = {
    name: "",
    level: 1,
    hp: 11,
    maxHp: 11,
    baseHp: 10,
    atk: 2,
    baseAtk: 1,
    exp: 0,
    nextExp: 10,
    gold: 0,
    weapon: null,
    armor: null,
    items: {
      potion: 0,
      hiPotion: 0,
      charm: 0
    },
    storage: []
  };

  const enemies = {
    normal: {
      name: "ゴースト",
      maxHp: 10,
      atk: 3,
      exp: 5,
      gold: 8
    },
    boss: {
      name: "鬼ゴースト",
      maxHp: 30,
      atk: 6,
      exp: 30,
      gold: 50
    }
  };

  const itemDefinitions = {
    potion: { id: "potion", name: "回復薬", heal: 10, price: 10 },
    hiPotion: { id: "hiPotion", name: "強回復薬", heal: 20, price: 25 },
    charm: { id: "charm", name: "お守り", atkUp: 2, price: 50 }
  };

  const equipDefinitions = {
    woodStick: {
      id: "woodStick",
      name: "木の枝",
      type: "weapon",
      power: 1,
      price: 5,
      nonBuyable: true
    },
    clothes: {
      id: "clothes",
      name: "普段着",
      type: "armor",
      hp: 1,
      price: 5,
      nonBuyable: true
    },
    woodSword: {
      id: "woodSword",
      name: "木の剣",
      type: "weapon",
      power: 2,
      price: 30,
      nonBuyable: false
    },
    ironSword: {
      id: "ironSword",
      name: "鉄の剣",
      type: "weapon",
      power: 4,
      price: 60,
      nonBuyable: false
    },
    ghostSword: {
      id: "ghostSword",
      name: "ゴーストバスター剣",
      type: "weapon",
      power: 7,
      price: 120,
      nonBuyable: false
    },
    leatherArmor: {
      id: "leatherArmor",
      name: "皮の服",
      type: "armor",
      hp: 5,
      price: 20,
      nonBuyable: false
    },
    heavyArmor: {
      id: "heavyArmor",
      name: "鎧",
      type: "armor",
      hp: 10,
      price: 50,
      nonBuyable: false
    }
  };

  function showScreen(id) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach(s => {
      if (s.id === id) {
        s.classList.remove("hidden");
      } else {
        s.classList.add("hidden");
      }
    });
    currentScreenId = id;
  }

  function setPlayerName(name) {
    player.name = name || "ななし";
  }

  function giveInitialEquip() {
    const weapon = { ...equipDefinitions.woodStick };
    const armor = { ...equipDefinitions.clothes };
    player.weapon = weapon;
    player.armor = armor;
    player.baseAtk = 1;
    player.baseHp = 10;
    player.atk = player.baseAtk + weapon.power;
    player.maxHp = player.baseHp + armor.hp;
    player.hp = player.maxHp;
  }

  function updateStatusValues() {
    let weaponPower = 0;
    let armorHp = 0;
    if (player.weapon && typeof player.weapon.power === "number") {
      weaponPower = player.weapon.power;
    }
    if (player.armor && typeof player.armor.hp === "number") {
      armorHp = player.armor.hp;
    }
    player.atk = player.baseAtk + weaponPower;
    player.maxHp = player.baseHp + armorHp;
    if (player.hp > player.maxHp) {
      player.hp = player.maxHp;
    }
  }

  function showPrologue() {
    showScreen("screen-prologue");
  }

  function showElder() {
    const elderText = document.getElementById("elderText");
    elderText.textContent = `勇者 ${player.name} よ……\n村を脅かす鬼ゴーストを倒し、\n平和を取り戻してくれ……`;
    showScreen("screen-elder");
  }

  function startVillage() {
    showScreen("screen-village");
  }

  function healPlayer() {
    player.hp = player.maxHp;
    alert("HPが全回復した！");
  }

  function getStatusText() {
    const weaponName = player.weapon ? player.weapon.name : "なし";
    const armorName = player.armor ? player.armor.name : "なし";
    return (
      `名前：${player.name}\n` +
      `レベル：${player.level}\n` +
      `HP：${player.hp} / ${player.maxHp}\n` +
      `攻撃力：${player.atk}\n` +
      `経験値：${player.exp} / ${player.nextExp}\n` +
      `所持金：${player.gold}G\n` +
      `武器：${weaponName}\n` +
      `防具：${armorName}`
    );
  }

  function showStatusScreen() {
    const statusTextElem = document.getElementById("statusText");
    statusTextElem.textContent = getStatusText();
    showScreen("screen-status");
  }

  function showItemsScreen() {
    const goldText = document.getElementById("itemsGoldText");
    goldText.textContent = `所持金：${player.gold}G`;
    const list = document.getElementById("itemList");
    list.innerHTML = "";
    if (player.items.potion > 0) {
      const div = document.createElement("div");
      div.textContent = `回復薬 × ${player.items.potion}`;
      div.addEventListener("click", () => selectItem("potion"));
      list.appendChild(div);
    }
    if (player.items.hiPotion > 0) {
      const div = document.createElement("div");
      div.textContent = `強回復薬 × ${player.items.hiPotion}`;
      div.addEventListener("click", () => selectItem("hiPotion"));
      list.appendChild(div);
    }
    if (player.items.charm > 0) {
      const div = document.createElement("div");
      div.textContent = `お守り × ${player.items.charm}`;
      div.addEventListener("click", () => selectItem("charm"));
      list.appendChild(div);
    }
    player.storage.forEach(item => {
      const div = document.createElement("div");
      div.textContent = item.name;
      div.addEventListener("click", () => selectEquip(item.id));
      list.appendChild(div);
    });
    if (!list.firstChild) {
      const div = document.createElement("div");
      div.textContent = "何も持っていません。";
      list.appendChild(div);
    }
    showScreen("screen-items");
  }

  function selectItem(type) {
    popupAction = "useItem";
    popupPayload = type;
    const def = itemDefinitions[type];
    let message = "";
    if (!def) {
      message = "このアイテムは使えません。";
    } else if (def.heal) {
      message = `${def.name}を使いますか？`;
    } else if (def.atkUp) {
      message = `${def.name}を使いますか？`;
    } else {
      message = "このアイテムを使いますか？";
    }
    showPopup(message);
  }

  function selectEquip(id) {
    popupAction = "equipItem";
    popupPayload = id;
    const item = getEquipById(id);
    if (!item) {
      showPopup("この装備は見つかりません。");
      return;
    }
    const message = `${item.name}を装備しますか？`;
    showPopup(message);
  }

  function showPopup(message) {
    const popup = document.getElementById("popup");
    const msgElem = document.getElementById("popupMessage");
    msgElem.textContent = message;
    popup.classList.remove("hidden");
  }

  function hidePopup() {
    const popup = document.getElementById("popup");
    popup.classList.add("hidden");
    popupAction = null;
    popupPayload = null;
  }

  function useItem(type) {
    const def = itemDefinitions[type];
    if (!def) {
      alert("このアイテムは使えません。");
      return;
    }
    if (type === "potion") {
      if (player.items.potion <= 0) {
        alert("回復薬を持っていません。");
        return;
      }
      player.items.potion -= 1;
      player.hp += def.heal;
      if (player.hp > player.maxHp) {
        player.hp = player.maxHp;
      }
      alert("HPが回復した！");
    } else if (type === "hiPotion") {
      if (player.items.hiPotion <= 0) {
        alert("強回復薬を持っていません。");
        return;
      }
      player.items.hiPotion -= 1;
      player.hp += def.heal;
      if (player.hp > player.maxHp) {
        player.hp = player.maxHp;
      }
      alert("HPが大きく回復した！");
    } else if (type === "charm") {
      if (player.items.charm <= 0) {
        alert("お守りを持っていません。");
        return;
      }
      player.items.charm -= 1;
      player.baseAtk += def.atkUp;
      updateStatusValues();
      alert("攻撃力が上がった！");
    } else {
      alert("このアイテムはまだ使えません。");
    }
    if (isInBattle) {
      updateBattleStatus();
    }
    if (currentScreenId === "screen-items") {
      showItemsScreen();
    }
  }

  function getEquipById(id) {
    if (player.weapon && player.weapon.id === id) {
      return player.weapon;
    }
    if (player.armor && player.armor.id === id) {
      return player.armor;
    }
    for (let i = 0; i < player.storage.length; i++) {
      if (player.storage[i].id === id) {
        return player.storage[i];
      }
    }
    return null;
  }

  function removeFromStorageById(id) {
    for (let i = 0; i < player.storage.length; i++) {
      if (player.storage[i].id === id) {
        player.storage.splice(i, 1);
        return;
      }
    }
  }

  function equipItem(id) {
    const item = getEquipById(id);
    if (!item) {
      alert("装備が見つかりません。");
      return;
    }
    if (item.type === "weapon") {
      if (player.weapon) {
        player.storage.push(player.weapon);
      }
      player.weapon = item;
      removeFromStorageById(id);
    } else if (item.type === "armor") {
      if (player.armor) {
        player.storage.push(player.armor);
      }
      player.armor = item;
      removeFromStorageById(id);
    } else {
      alert("この装備は装備できません。");
      return;
    }
    updateStatusValues();
    alert("装備を変更しました！");
    if (currentScreenId === "screen-items") {
      showItemsScreen();
    }
    if (currentScreenId === "screen-status") {
      showStatusScreen();
    }
  }

  function enterShop(type) {
    currentShopType = type;
    const titleElem = document.getElementById("shopTitle");
    if (type === "item") {
      titleElem.textContent = "道具屋";
    } else {
      titleElem.textContent = "武器屋";
    }
    showScreen("screen-shopMenu");
  }

  function showShopBuy() {
    const titleElem = document.getElementById("shopBuyTitle");
    const goldText = document.getElementById("shopGoldText");
    const list = document.getElementById("shopBuyList");
    goldText.textContent = `所持金：${player.gold}G`;
    list.innerHTML = "";
    if (currentShopType === "item") {
      Object.keys(itemDefinitions).forEach(key => {
        const def = itemDefinitions[key];
        const div = document.createElement("div");
        div.textContent = `${def.name}（${def.price}G）`;
        div.addEventListener("click", () => buyItem(key));
        list.appendChild(div);
      });
      titleElem.textContent = "道具屋：買い物";
    } else {
      Object.keys(equipDefinitions).forEach(key => {
        const def = equipDefinitions[key];
        if (def.nonBuyable) {
          return;
        }
        const div = document.createElement("div");
        if (def.type === "weapon") {
          div.textContent = `${def.name}（攻撃＋${def.power}） ${def.price}G`;
        } else if (def.type === "armor") {
          div.textContent = `${def.name}（HP＋${def.hp}） ${def.price}G`;
        } else {
          div.textContent = `${def.name} ${def.price}G`;
        }
        div.addEventListener("click", () => buyEquip(key));
        list.appendChild(div);
      });
      titleElem.textContent = "武器屋：買い物";
    }
    showScreen("screen-shopBuy");
  }

  function showShopSell() {
    const goldText = document.getElementById("shopSellGoldText");
    const list = document.getElementById("shopSellList");
    goldText.textContent = `所持金：${player.gold}G`;
    list.innerHTML = "";
    if (player.items.potion > 0) {
      const div = document.createElement("div");
      div.textContent = `回復薬 × ${player.items.potion}`;
      div.addEventListener("click", () => sellItem("potion"));
      list.appendChild(div);
    }
    if (player.items.hiPotion > 0) {
      const div = document.createElement("div");
      div.textContent = `強回復薬 × ${player.items.hiPotion}`;
      div.addEventListener("click", () => sellItem("hiPotion"));
      list.appendChild(div);
    }
    if (player.items.charm > 0) {
      const div = document.createElement("div");
      div.textContent = `お守り × ${player.items.charm}`;
      div.addEventListener("click", () => sellItem("charm"));
      list.appendChild(div);
    }
    player.storage.forEach(item => {
      const div = document.createElement("div");
      div.textContent = item.name;
      div.addEventListener("click", () => sellEquip(item.id));
      list.appendChild(div);
    });
    if (!list.firstChild) {
      const div = document.createElement("div");
      div.textContent = "売れるものを持っていません。";
      list.appendChild(div);
    }
    showScreen("screen-shopSell");
  }

  function buyItem(type) {
    const def = itemDefinitions[type];
    if (!def) {
      alert("このアイテムは買えません。");
      return;
    }
    if (player.gold < def.price) {
      alert("お金が足りません。");
      return;
    }
    player.gold -= def.price;
    if (type === "potion") {
      player.items.potion += 1;
    } else if (type === "hiPotion") {
      player.items.hiPotion += 1;
    } else if (type === "charm") {
      player.items.charm += 1;
    }
    alert("購入しました！");
    showShopBuy();
  }

  function buyEquip(key) {
    const def = equipDefinitions[key];
    if (!def) {
      alert("この装備は買えません。");
      return;
    }
    if (player.gold < def.price) {
      alert("お金が足りません。");
      return;
    }
    player.gold -= def.price;
    const item = { ...def };
    if (item.type === "weapon") {
      if (player.weapon) {
        player.storage.push(player.weapon);
      }
      player.weapon = item;
    } else if (item.type === "armor") {
      if (player.armor) {
        player.storage.push(player.armor);
      }
      player.armor = item;
    } else {
      player.storage.push(item);
    }
    updateStatusValues();
    alert("装備を手に入れた！");
    showShopBuy();
  }

  function sellItem(type) {
    const def = itemDefinitions[type];
    if (!def) {
      alert("このアイテムは売れません。");
      return;
    }
    let count = 0;
    if (type === "potion") {
      count = player.items.potion;
    } else if (type === "hiPotion") {
      count = player.items.hiPotion;
    } else if (type === "charm") {
      count = player.items.charm;
    }
    if (count <= 0) {
      alert("そのアイテムを持っていません。");
      return;
    }
    const price = Math.floor(def.price / 2);
    popupAction = "sellItem";
    popupPayload = { type, price };
    showPopup(`${def.name}を${price}Gで売りますか？`);
  }

  function sellEquip(id) {
    const item = getEquipById(id);
    if (!item) {
      alert("装備が見つかりません。");
      return;
    }
    const price = Math.floor(item.price / 2);
    popupAction = "sellEquip";
    popupPayload = { id, price, name: item.name };
    showPopup(`${item.name}を${price}Gで売りますか？`);
  }

  function confirmSellItem(payload) {
    const type = payload.type;
    const price = payload.price;
    if (type === "potion") {
      if (player.items.potion <= 0) {
        alert("回復薬を持っていません。");
        return;
      }
      player.items.potion -= 1;
    } else if (type === "hiPotion") {
      if (player.items.hiPotion <= 0) {
        alert("強回復薬を持っていません。");
        return;
      }
      player.items.hiPotion -= 1;
    } else if (type === "charm") {
      if (player.items.charm <= 0) {
        alert("お守りを持っていません。");
        return;
      }
      player.items.charm -= 1;
    } else {
      alert("このアイテムは売れません。");
      return;
    }
    player.gold += price;
    alert(`${price}Gで売りました。`);
    showShopSell();
  }

  function confirmSellEquip(payload) {
    const id = payload.id;
    const price = payload.price;
    const item = getEquipById(id);
    if (!item) {
      alert("装備が見つかりません。");
      return;
    }
    if (player.weapon && player.weapon.id === id) {
      player.weapon = null;
    } else if (player.armor && player.armor.id === id) {
      player.armor = null;
    } else {
      removeFromStorageById(id);
    }
    player.gold += price;
    updateStatusValues();
    alert(`${payload.name}を${price}Gで売りました。`);
    showShopSell();
  }

  function saveGame() {
    try {
      const data = JSON.stringify(player);
      localStorage.setItem("ghostQuestSave", data);
      alert("セーブしました。");
    } catch (e) {
      console.error(e);
      alert("セーブに失敗しました。");
    }
  }

  function loadGame() {
    try {
      const data = localStorage.getItem("ghostQuestSave");
      if (!data) {
        alert("セーブデータがありません。");
        return;
      }
      const obj = JSON.parse(data);
      Object.assign(player, obj);
      updateStatusValues();
      alert("ロードしました。");
      startVillage();
    } catch (e) {
      console.error(e);
      alert("ロードに失敗しました。");
    }
  }

  function startField() {
    document.getElementById("fieldMessage").textContent = "フィールドを歩いています……";
    showScreen("screen-field");
  }

  function startBattle(isBoss) {
    isInBattle = true;
    isBossBattle = isBoss;
    const enemyDef = isBoss ? enemies.boss : enemies.normal;
    currentEnemy = {
      name: enemyDef.name,
      hp: enemyDef.maxHp,
      maxHp: enemyDef.maxHp,
      atk: enemyDef.atk,
      exp: enemyDef.exp,
      gold: enemyDef.gold
    };
    const title = document.getElementById("battleTitle");
    title.textContent = isBoss ? "ボス戦" : "戦闘";
    const log = document.getElementById("battleLog");
    log.textContent = `${enemyDef.name}があらわれた！\n`;
    updateBattleStatus();
    showScreen("screen-battle");
  }

  function updateBattleStatus() {
    const playerText = document.getElementById("playerStatusText");
    const enemyText = document.getElementById("enemyStatusText");
    playerText.textContent =
      `名前：${player.name}\nHP：${player.hp} / ${player.maxHp}\n攻撃力：${player.atk}`;
    enemyText.textContent =
      `名前：${currentEnemy.name}\nHP：${currentEnemy.hp} / ${currentEnemy.maxHp}\n攻撃力：${currentEnemy.atk}`;
  }

  function appendBattleLog(text) {
    const log = document.getElementById("battleLog");
    log.textContent += text + "\n";
    log.scrollTop = log.scrollHeight;
  }

  function playerAttack() {
    const damage = Math.max(1, player.atk + Math.floor(Math.random() * 3) - 1);
    currentEnemy.hp -= damage;
    if (currentEnemy.hp < 0) {
      currentEnemy.hp = 0;
    }
    appendBattleLog(`勇者 ${player.name} のこうげき！ ${currentEnemy.name}に ${damage} のダメージ！`);
    updateBattleStatus();
    if (currentEnemy.hp <= 0) {
      winBattle();
    } else {
      enemyTurn();
    }
  }

  function enemyTurn() {
    if (currentEnemy.hp <= 0) {
      return;
    }
    const damage = Math.max(1, currentEnemy.atk + Math.floor(Math.random() * 3) - 1);
    player.hp -= damage;
    if (player.hp < 0) {
      player.hp = 0;
    }
    appendBattleLog(`${currentEnemy.name}のこうげき！ ${player.name}は ${damage} のダメージを受けた！`);
    updateBattleStatus();
    if (player.hp <= 0) {
      loseBattle();
    }
  }

  function winBattle() {
    appendBattleLog(`${currentEnemy.name}をたおした！`);
    isInBattle = false;
    const expGain = currentEnemy.exp;
    const goldGain = currentEnemy.gold;
    player.exp += expGain;
    player.gold += goldGain;
    appendBattleLog(`経験値 ${expGain} を手に入れた！`);
    appendBattleLog(`${goldGain}G を手に入れた！`);
    checkLevelUp();
    if (isBossBattle) {
      setTimeout(() => {
        showEnding();
      }, 800);
    } else {
      setTimeout(() => {
        startField();
      }, 800);
    }
  }

  function loseBattle() {
    appendBattleLog("力尽きてしまった……");
    isInBattle = false;
    setTimeout(() => {
      alert("ゲームオーバー……村に戻ります。");
      player.hp = player.maxHp;
      startVillage();
    }, 800);
  }

  function checkLevelUp() {
    while (player.exp >= player.nextExp) {
      player.exp -= player.nextExp;
      player.level += 1;
      player.baseHp += 2;
      player.baseAtk += 1;
      player.nextExp += 10;
      updateStatusValues();
      appendBattleLog(`レベルが ${player.level} に上がった！`);
    }
  }

  function showEnding() {
    showScreen("screen-ending");
  }

  function initNameScreen() {
    const savedName = localStorage.getItem("ghostQuestName");
    if (savedName) {
      setPlayerName(savedName);
      giveInitialEquip();
      startVillage();
      return;
    }
    showScreen("screen-name");
  }

  function handleStartButton() {
    const input = document.getElementById("playerNameInput");
    const name = input.value.trim();
    setPlayerName(name);
    try {
      localStorage.setItem("ghostQuestName", player.name);
    } catch (e) {
      console.error(e);
    }
    giveInitialEquip();
    showPrologue();
  }

  function setupEventHandlers() {
    document.getElementById("startButton").addEventListener("click", handleStartButton);
    document.getElementById("prologueNextButton").addEventListener("click", showElder);
    document.getElementById("elderToVillageButton").addEventListener("click", startVillage);

    document.getElementById("healButton").addEventListener("click", () => {
      healPlayer();
    });
    document.getElementById("statusButton").addEventListener("click", showStatusScreen);
    document.getElementById("itemsButton").addEventListener("click", showItemsScreen);
    document.getElementById("itemShopButton").addEventListener("click", () => enterShop("item"));
    document.getElementById("weaponShopButton").addEventListener("click", () => enterShop("weapon"));
    document.getElementById("saveButton").addEventListener("click", saveGame);
    document.getElementById("loadButton").addEventListener("click", loadGame);
    document.getElementById("toFieldButton").addEventListener("click", startField);

    document.getElementById("fieldStatusButton").addEventListener("click", showStatusScreen);
    document.getElementById("fieldItemsButton").addEventListener("click", showItemsScreen);
    document.getElementById("fieldBackButton").addEventListener("click", startVillage);
    document.getElementById("fieldEncounterButton").addEventListener("click", () => startBattle(false));
    document.getElementById("fieldBossButton").addEventListener("click", () => startBattle(true));

    document.getElementById("statusBackButton").addEventListener("click", () => {
      if (currentScreenId === "screen-status") {
        if (isInBattle) {
          showScreen("screen-battle");
        } else if (currentShopType) {
          showScreen("screen-shopMenu");
        } else {
          startVillage();
        }
      }
    });

    document.getElementById("itemsBackButton").addEventListener("click", () => {
      if (isInBattle) {
        showScreen("screen-battle");
      } else if (currentScreenId === "screen-items") {
        if (currentShopType) {
          showScreen("screen-shopMenu");
        } else if (currentScreenId === "screen-items") {
          startVillage();
        }
      }
    });

    document.getElementById("shopBuyButton").addEventListener("click", showShopBuy);
    document.getElementById("shopSellButton").addEventListener("click", showShopSell);
    document.getElementById("shopExitButton").addEventListener("click", () => {
      currentShopType = null;
      startVillage();
    });

    document.getElementById("shopBuyBackButton").addEventListener("click", () => {
      showScreen("screen-shopMenu");
    });
    document.getElementById("shopSellBackButton").addEventListener("click", () => {
      showScreen("screen-shopMenu");
    });

    document.getElementById("attackButton").addEventListener("click", () => {
      if (isInBattle) {
        playerAttack();
      }
    });
    document.getElementById("battleItemButton").addEventListener("click", () => {
      if (isInBattle) {
        showItemsScreen();
      }
    });
    document.getElementById("battleRunButton").addEventListener("click", () => {
      if (isInBattle) {
        appendBattleLog("にげだした！");
        isInBattle = false;
        startField();
      }
    });

    document.getElementById("popupYesButton").addEventListener("click", () => {
      if (popupAction === "useItem") {
        useItem(popupPayload);
      } else if (popupAction === "equipItem") {
        equipItem(popupPayload);
      } else if (popupAction === "sellItem") {
        confirmSellItem(popupPayload);
      } else if (popupAction === "sellEquip") {
        confirmSellEquip(popupPayload);
      }
      hidePopup();
    });

    document.getElementById("popupNoButton").addEventListener("click", () => {
      hidePopup();
    });

    document.getElementById("endingToTitleButton").addEventListener("click", () => {
      player.hp = player.maxHp;
      startVillage();
    });
  }

  function initScrollPrevention() {
    const isiPhone = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isiPhone) {
      document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
      document.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
      document.body.style.overflow = "hidden";
    }
  }

  function init() {
    try {
      initScrollPrevention();
      setupEventHandlers();
      initNameScreen();
    } catch (e) {
      console.error(e);
      alert("初期化中にエラーが発生しました。");
    }
  }

  window.addEventListener("load", init);
})();
