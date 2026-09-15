(function () {
  "use strict";

  let currentScreenId = "screen-name";
  let currentShopType = null;
  let popupAction = null;
  let popupPayload = null;
  let isInBattle = false;
  let currentEnemy = null;
  let isBossBattle = false;

  const player = {
  name: "",
  level: 1,

  // 実際の初期ステータス
  hp: 35,
  maxHp: 35,
  atk: 6,
  def: 3,

  // レベルアップ計算に使われる基礎値（ここが初期値と一致していないと戻される）
  baseHp: 35,
  baseAtk: 6,

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
      exp: 10,
      gold: 20,
      img: "ghost.png"
    },
    boss: {
      name: "鬼ゴースト",
      maxHp: 1000,
      atk: 40,
      exp: 300,
      gold: 50,
      img: "boss_ghost.png"
    }
  };

  const itemDefinitions = {
    potion: { id: "potion", name: "回復薬", heal: 10, price: 100 },
    hiPotion: { id: "hiPotion", name: "強回復薬", heal: 100, price: 500 },
    charm: { id: "charm", name: "お守り", atkUp: 20, price: 250 }
  };

  const equipDefinitions = {
    woodStick: { id: "woodStick", name: "木の枝", type: "weapon", power: 1, price: 5, nonBuyable: true },
    clothes: { id: "clothes", name: "普段着", type: "armor", hp: 1, price: 5, nonBuyable: true },
    woodSword: { id: "woodSword", name: "木の剣", type: "weapon", power: 10, price: 130, nonBuyable: false },
    ironSword: { id: "ironSword", name: "鉄の剣", type: "weapon", power: 20, price: 260, nonBuyable: false },
    ghostSword: { id: "ghostSword", name: "ゴーストバスター剣", type: "weapon", power: 70, price: 1200, nonBuyable: false },
    leatherArmor: { id: "leatherArmor", name: "皮の服", type: "armor", hp: 15, price: 120, nonBuyable: false },
    heavyArmor: { id: "heavyArmor", name: "鎧", type: "armor", hp: 50, price: 500, nonBuyable: false }
  };

  const bgm = {
    village: document.getElementById("bgmVillage"),
    field: document.getElementById("bgmField"),
    enemyBattle: document.getElementById("bgmEnemyBattle"),
    bossBattle: document.getElementById("bgmBossBattle"),
    prologue: document.getElementById("bgmPrologue"),
    ending: document.getElementById("bgmEnding")
  };

  const se = {
    attack: document.getElementById("seAttack"),
    enemyAttack: document.getElementById("seEnemyAttack"),
    damage: document.getElementById("seDamage"),
    playerDead: document.getElementById("sePlayerDead"),
    dead: document.getElementById("seDead"),
    encounter: document.getElementById("seEncounter"),
    bossEncounter: document.getElementById("seBossEncounter"),
    enemyBattleEnd: document.getElementById("seEnemyBattleEnd"),
    bossBattleEnd: document.getElementById("seBossBattleEnd"),
    click: document.getElementById("seClick"),
    buy: document.getElementById("seBuy"),
    sell: document.getElementById("seSell"),
    item: document.getElementById("seItem"),
    equip: document.getElementById("seEquip"),
    heal: document.getElementById("seHeal")
  };

  function stopAllBgm() {
    Object.values(bgm).forEach(b => {
      b.pause();
      b.currentTime = 0;
    });
  }

  function playBgm(name) {
    stopAllBgm();
    if (bgm[name]) bgm[name].play();
  }

  function setBackground(src) {
    document.getElementById("bgImage").src = src;
  }
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => {
      s.classList.toggle("hidden", s.id !== id);
    });
    currentScreenId = id;
  }

  function setPlayerName(name) {
    player.name = name || "ななし";
  }

  function giveInitialEquip() {
    player.weapon = { ...equipDefinitions.woodStick };
    player.armor = { ...equipDefinitions.clothes };
    player.baseAtk = 6;
    player.baseHp = 35;
    updateStatusValues();
    player.hp = player.maxHp;
  }

  function updateStatusValues() {
    const wp = player.weapon ? player.weapon.power : 0;
    const ap = player.armor ? player.armor.hp : 0;
    player.atk = player.baseAtk + wp;
    player.maxHp = player.baseHp + ap;
    if (player.hp > player.maxHp) player.hp = player.maxHp;
  }

  function showPrologue() {
    playBgm("prologue");
    setBackground("village_bg.png");
    showScreen("screen-prologue");
  }

  function showElder() {
    document.getElementById("elderText").textContent =
      `勇者 ${player.name} よ……\n村を脅かす鬼ゴーストを倒し、\n平和を取り戻してくれ……`;
    showScreen("screen-elder");
  }

  function startVillage() {
    playBgm("village");
    setBackground("village_bg.png");
    showScreen("screen-village");
  }

  function healPlayer() {
    player.hp = player.maxHp;
    se.heal.play();
    alert("HPが全回復した！");
  }

  function getStatusText() {
    return (
      `名前：${player.name}\n` +
      `レベル：${player.level}\n` +
      `HP：${player.hp} / ${player.maxHp}\n` +
      `攻撃力：${player.atk}\n` +
      `経験値：${player.exp} / ${player.nextExp}\n` +
      `所持金：${player.gold}G\n` +
      `武器：${player.weapon ? player.weapon.name : "なし"}\n` +
      `防具：${player.armor ? player.armor.name : "なし"}`
    );
  }

  function showStatusScreen() {
    updateStatusScreen();
    showScreen("screen-status");
  }

  function showItemsScreen() {
    document.getElementById("itemsGoldText").textContent = `所持金：${player.gold}G`;
    const list = document.getElementById("itemList");
    list.innerHTML = "";

    if (player.items.potion > 0) {
      const d = document.createElement("div");
      d.textContent = `回復薬 × ${player.items.potion}`;
      d.onclick = () => selectItem("potion");
      list.appendChild(d);
    }
    if (player.items.hiPotion > 0) {
      const d = document.createElement("div");
      d.textContent = `強回復薬 × ${player.items.hiPotion}`;
      d.onclick = () => selectItem("hiPotion");
      list.appendChild(d);
    }
    if (player.items.charm > 0) {
      const d = document.createElement("div");
      d.textContent = `お守り × ${player.items.charm}`;
      d.onclick = () => selectItem("charm");
      list.appendChild(d);
    }

    player.storage.forEach(item => {
      const d = document.createElement("div");
      d.textContent = item.name;
      d.onclick = () => selectEquip(item.id);
      list.appendChild(d);
    });

    if (!list.firstChild) {
      const d = document.createElement("div");
      d.textContent = "何も持っていません。";
      list.appendChild(d);
    }

    showScreen("screen-items");
  }

  function showPopup(msg) {
    document.getElementById("popupMessage").textContent = msg;
    document.getElementById("popup").classList.remove("hidden");
  }

  function hidePopup() {
    document.getElementById("popup").classList.add("hidden");
    popupAction = null;
    popupPayload = null;
  }

  function selectItem(type) {
    popupAction = "useItem";
    popupPayload = type;
    showPopup(`${itemDefinitions[type].name}を使いますか？`);
  }

  function useItem(type) {
    const def = itemDefinitions[type];
    if (type === "potion") {
      if (player.items.potion <= 0) return alert("回復薬を持っていません。");
      player.items.potion--;
      player.hp = Math.min(player.maxHp, player.hp + def.heal);
    } else if (type === "hiPotion") {
      if (player.items.hiPotion <= 0) return alert("強回復薬を持っていません。");
      player.items.hiPotion--;
      player.hp = Math.min(player.maxHp, player.hp + def.heal);
    } else if (type === "charm") {
      if (player.items.charm <= 0) return alert("お守りを持っていません。");
      player.items.charm--;
      player.baseAtk += def.atkUp;
      updateStatusValues();
    }
    se.item.play();
    alert("使用しました！");
    if (isInBattle) updateBattleStatus();
    if (currentScreenId === "screen-items") showItemsScreen();
  }

  function updateStatusScreen() {
    document.getElementById("stName").textContent = player.name;
    document.getElementById("stLevel").textContent = player.level;
    document.getElementById("stHp").textContent = `${player.hp} / ${player.maxHp}`;
    document.getElementById("stAtk").textContent = player.atk;
    document.getElementById("stDef").textContent = player.def;
    document.getElementById("stNextExp").textContent = player.nextExp - player.exp;
    document.getElementById("stGold").textContent = player.gold;
  }


  function selectEquip(id) {
    popupAction = "equipItem";
    popupPayload = id;
    const item = getEquipById(id);
    showPopup(`${item.name}を装備しますか？`);
  }

  function getEquipById(id) {
    if (player.weapon && player.weapon.id === id) return player.weapon;
    if (player.armor && player.armor.id === id) return player.armor;
    return player.storage.find(i => i.id === id);
  }

  function removeFromStorageById(id) {
    const i = player.storage.findIndex(x => x.id === id);
    if (i >= 0) player.storage.splice(i, 1);
  }

  function equipItem(id) {
    const item = getEquipById(id);
    if (item.type === "weapon") {
      if (player.weapon) player.storage.push(player.weapon);
      player.weapon = item;
    } else {
      if (player.armor) player.storage.push(player.armor);
      player.armor = item;
    }
    removeFromStorageById(id);
    updateStatusValues();
    se.equip.play();
    alert("装備しました！");
    if (currentScreenId === "screen-items") showItemsScreen();
    if (currentScreenId === "screen-status") showStatusScreen();
  }

  function enterShop(type) {
    currentShopType = type;
    document.getElementById("shopTitle").textContent =
      type === "item" ? "道具屋" : "武器屋";
    showScreen("screen-shopMenu");
  }

  function showShopBuy() {
    document.getElementById("shopGoldText").textContent = `所持金：${player.gold}G`;
    const list = document.getElementById("shopBuyList");
    list.innerHTML = "";

    if (currentShopType === "item") {
      Object.keys(itemDefinitions).forEach(k => {
        const def = itemDefinitions[k];
        const d = document.createElement("div");
        d.textContent = `${def.name}（${def.price}G）`;
        d.onclick = () => buyItem(k);
        list.appendChild(d);
      });
    } else {
      Object.keys(equipDefinitions).forEach(k => {
        const def = equipDefinitions[k];
        if (def.nonBuyable) return;
        const d = document.createElement("div");
        d.textContent =
          def.type === "weapon"
            ? `${def.name}（攻撃＋${def.power}） ${def.price}G`
            : `${def.name}（HP＋${def.hp}） ${def.price}G`;
        d.onclick = () => buyEquip(k);
        list.appendChild(d);
      });
    }

    showScreen("screen-shopBuy");
  }

  function buyItem(type) {
    const def = itemDefinitions[type];
    if (player.gold < def.price) return alert("お金が足りません。");
    player.gold -= def.price;
    if (type === "potion") player.items.potion++;
    else if (type === "hiPotion") player.items.hiPotion++;
    else player.items.charm++;
    se.buy.play();
    alert("購入しました！");
    showShopBuy();
  }

  function buyEquip(key) {
    const def = equipDefinitions[key];
    if (player.gold < def.price) return alert("お金が足りません。");
    player.gold -= def.price;
    const item = { ...def };
    if (item.type === "weapon") {
      if (player.weapon) player.storage.push(player.weapon);
      player.weapon = item;
    } else {
      if (player.armor) player.storage.push(player.armor);
      player.armor = item;
    }
    updateStatusValues();
    se.buy.play();
    alert("装備を手に入れた！");
    showShopBuy();
  }

  function showShopSell() {
    document.getElementById("shopSellGoldText").textContent = `所持金：${player.gold}G`;
    const list = document.getElementById("shopSellList");
    list.innerHTML = "";

    if (player.items.potion > 0) {
      const d = document.createElement("div");
      d.textContent = `回復薬 × ${player.items.potion}`;
      d.onclick = () => sellItem("potion");
      list.appendChild(d);
    }
    if (player.items.hiPotion > 0) {
      const d = document.createElement("div");
      d.textContent = `強回復薬 × ${player.items.hiPotion}`;
      d.onclick = () => sellItem("hiPotion");
      list.appendChild(d);
    }
    if (player.items.charm > 0) {
      const d = document.createElement("div");
      d.textContent = `お守り × ${player.items.charm}`;
      d.onclick = () => sellItem("charm");
      list.appendChild(d);
    }

    player.storage.forEach(item => {
      const d = document.createElement("div");
      d.textContent = item.name;
      d.onclick = () => sellEquip(item.id);
      list.appendChild(d);
    });

    if (!list.firstChild) {
      const d = document.createElement("div");
      d.textContent = "売れるものを持っていません。";
      list.appendChild(d);
    }

    showScreen("screen-shopSell");
  }

  function sellItem(type) {
    const def = itemDefinitions[type];
    const count =
      type === "potion" ? player.items.potion :
      type === "hiPotion" ? player.items.hiPotion :
      player.items.charm;

    if (count <= 0) return alert("そのアイテムを持っていません。");

    const price = Math.floor(def.price / 2);
    popupAction = "sellItem";
    popupPayload = { type, price };
    showPopup(`${def.name}を${price}Gで売りますか？`);
  }

  function sellEquip(id) {
    const item = getEquipById(id);
    const price = Math.floor(item.price / 2);
    popupAction = "sellEquip";
    popupPayload = { id, price, name: item.name };
    showPopup(`${item.name}を${price}Gで売りますか？`);
  }

  function confirmSellItem(payload) {
    const { type, price } = payload;

    if (type === "potion") player.items.potion--;
    else if (type === "hiPotion") player.items.hiPotion--;
    else player.items.charm--;

    player.gold += price;
    se.sell.play();
    alert(`${price}Gで売りました。`);
    showShopSell();
  }

  function confirmSellEquip(payload) {
    const { id, price, name } = payload;
    const item = getEquipById(id);

    if (player.weapon && player.weapon.id === id) player.weapon = null;
    else if (player.armor && player.armor.id === id) player.armor = null;
    else removeFromStorageById(id);

    player.gold += price;
    updateStatusValues();
    se.sell.play();
    alert(`${name}を${price}Gで売りました。`);
    showShopSell();
  }
  function startField() {
    playBgm("field");
    setBackground("field_bg.png");
    document.getElementById("fieldMessage").textContent = "フィールドを歩いています……";
    showScreen("screen-field");
  }

  function startBattle(isBoss) {
    isInBattle = true;
    isBossBattle = isBoss;

    const def = isBoss ? enemies.boss : enemies.normal;
    currentEnemy = {
      name: def.name,
      hp: def.maxHp,
      maxHp: def.maxHp,
      atk: def.atk,
      exp: def.exp,
      gold: def.gold,
      img: def.img
    };

    document.getElementById("battleEnemyImg").src = currentEnemy.img;
    document.getElementById("battleHeroImg").src = "hero.png";

    // ★ここに追加（安全な位置）
    const enemyImg = document.getElementById("battleEnemyImg");

    if (isBoss) {
      enemyImg.classList.add("boss-enemy");
      enemyImg.classList.remove("enemy-small");
    } else {
      enemyImg.classList.remove("boss-enemy");
      enemyImg.classList.add("enemy-small");
    }

    if (isBoss) {
      playBgm("bossBattle");
      setBackground("castle_bg.png");
      document.getElementById("battleTitle").textContent = "ボス戦";
      se.bossEncounter.play();
    } else {
      playBgm("enemyBattle");
      setBackground("field_bg.png");
      document.getElementById("battleTitle").textContent = "戦闘";
      se.encounter.play();
    }

    const log = document.getElementById("battleLog");
    log.textContent = `${currentEnemy.name}があらわれた！\n`;

    updateBattleStatus();
    showScreen("screen-battle");
  }

  function updateBattleStatus() {
    document.getElementById("playerStatusText").textContent =
      `名前：${player.name}\nHP：${player.hp} / ${player.maxHp}\n攻撃力：${player.atk}`;

    document.getElementById("enemyStatusText").textContent =
      `名前：${currentEnemy.name}\nHP：${currentEnemy.hp} / ${currentEnemy.maxHp}\n攻撃力：${currentEnemy.atk}`;
    const heroImg = document.getElementById("battleHeroImg");
    if (player.hp <= player.maxHp * 0.3) {
      heroImg.classList.add("pinch");
    } else {
      heroImg.classList.remove("pinch");
    }  
  }

  function appendBattleLog(text) {
    const log = document.getElementById("battleLog");
    log.innerHTML += text.replace(/\n/g, "<br>") + "<br>";
  }


  function playerAttack() {
    const log = document.getElementById("battleLog");
    log.textContent = "";  
    const damage = Math.max(1, currentEnemy.atk - player.def + Math.floor(Math.random() * 10));
    currentEnemy.hp -= damage;
    if (currentEnemy.hp < 0) currentEnemy.hp = 0;
  
    se.attack.play();
  
    // ★ 安全な演出（nullチェック必須）
    const enemyImg = document.getElementById("battleEnemyImg");
      if (enemyImg) {
        enemyImg.classList.add("hit-flash");
        setTimeout(() => enemyImg.classList.remove("hit-flash"), 500);
      }  
    appendBattleLog(`勇者 ${player.name} のこうげき！ ${currentEnemy.name}に ${damage} のダメージ！`);
    updateBattleStatus();
  
    if (currentEnemy.hp <= 0) {
      winBattle();
    } else {
      setTimeout(() => {
        enemyTurn();
      }, 1000); // ← ディレイ増やしたいならここ
    }
  }

  function enemyTurn() {
    const log = document.getElementById("battleLog");
    log.textContent = "";

    const damage = Math.max(1, currentEnemy.atk + Math.floor(Math.random() * 3) - 1);
    player.hp -= damage;
    if (player.hp < 0) player.hp = 0;
  
    se.enemyAttack.play();
  
    // ★ 安全な演出（nullチェック必須）
    const heroImg = document.getElementById("battleHeroImg");
    if (heroImg) {
      heroImg.classList.add("shake");
      setTimeout(() => heroImg.classList.remove("shake"), 300);
    }
  
    appendBattleLog(`${currentEnemy.name}のこうげき！ ${player.name}は ${damage} のダメージを受けた！`);
    updateBattleStatus();
    if (player.hp > 0 && player.hp <= player.maxHp * 0.3) {
      appendBattleLog(`⚠ ピンチ！これ以上ダメージを受けると危険！`);
    }

    if (player.hp <= 0) {
      loseBattle();
    }
  }


  function winBattle() {
    appendBattleLog(`${currentEnemy.name}をたおした！`);
    isInBattle = false;

    player.exp += currentEnemy.exp;
    player.gold += currentEnemy.gold;

    appendBattleLog(`経験値 ${currentEnemy.exp} を手に入れた！`);
    appendBattleLog(`${currentEnemy.gold}G を手に入れた！`);

    if (isBossBattle) se.bossBattleEnd.play();
    else se.enemyBattleEnd.play();

    checkLevelUp();

    setTimeout(() => {
      if (isBossBattle) {
        showEnding();
      } else {
        startField();
      }
    }, 800);
  }

  function loseBattle() {
    appendBattleLog("力尽きてしまった……");
    isInBattle = false;
    se.playerDead.play();

    setTimeout(() => {
      alert("ゲームオーバー……村に戻ります。");
      player.hp = player.maxHp;
      startVillage();
    }, 800);
  }

  function checkLevelUp() {
    while (player.exp >= player.nextExp) {
      player.exp -= player.nextExp;
      player.level++;
      player.baseHp += 4;
      player.baseAtk += 2;
      player.def += 2;
      player.nextExp += 10;
      updateStatusValues();
      appendBattleLog(`レベルが ${player.level} に上がった！`);
      const battleScreen = document.getElementById("screen-battle");
      battleScreen.classList.add("levelup-flash");
      setTimeout(() => battleScreen.classList.remove("levelup-flash"), 800);
    }
  }

  function showEnding() {
    playBgm("ending");
    setBackground("castle_bg.png");
    showScreen("screen-ending");
  }
  function saveGame() {
    try {
      localStorage.setItem("ghostQuestSave", JSON.stringify(player));
      alert("セーブしました。");
    } catch {
      alert("セーブに失敗しました。");
    }
  }

  function loadGame() {
    try {
      const data = localStorage.getItem("ghostQuestSave");
      if (!data) return alert("セーブデータがありません。");
      Object.assign(player, JSON.parse(data));
      updateStatusValues();
      alert("ロードしました。");
      startVillage();
    } catch {
      alert("ロードに失敗しました。");
    }
  }

  function resetGame() {
    localStorage.removeItem("ghostQuestName");
    localStorage.removeItem("ghostQuestSave");
    alert("データを初期化しました。ページを再読み込みします。");
    location.reload();
  }

  function initNameScreen() {
    const savedName = localStorage.getItem("ghostQuestName");
    if (savedName) {
      setPlayerName(savedName);
      giveInitialEquip();
      startVillage();
      return;
    }
    setBackground("village_bg.png");
    showScreen("screen-name");
  }

  function handleStartButton() {
    const input = document.getElementById("playerNameInput");
    const name = input.value.trim();
    setPlayerName(name);
    localStorage.setItem("ghostQuestName", player.name);
    giveInitialEquip();
    showPrologue();
  }

  function setupEventHandlers() {
    document.getElementById("startButton").onclick = () => {
      se.click.play();
      handleStartButton();
    };

    document.getElementById("resetButton").onclick = () => {
      se.click.play();
      popupAction = "resetGame";
      popupPayload = null;
      showPopup("本当に初期化しますか？（データはすべて消えます）");
    };

    document.getElementById("prologueNextButton").onclick = () => {
      se.click.play();
      showElder();
    };

    document.getElementById("elderToVillageButton").onclick = () => {
      se.click.play();
      startVillage();
    };

    document.getElementById("healButton").onclick = () => {
      se.click.play();
      healPlayer();
    };

    document.getElementById("statusButton").onclick = () => {
      se.click.play();
      showStatusScreen();
    };

    document.getElementById("itemsButton").onclick = () => {
      se.click.play();
      showItemsScreen();
    };

    document.getElementById("itemShopButton").onclick = () => {
      se.click.play();
      enterShop("item");
    };

    document.getElementById("weaponShopButton").onclick = () => {
      se.click.play();
      enterShop("weapon");
    };

    document.getElementById("saveButton").onclick = () => {
      se.click.play();
      saveGame();
    };

    document.getElementById("loadButton").onclick = () => {
      se.click.play();
      loadGame();
    };

    document.getElementById("toFieldButton").onclick = () => {
      se.click.play();
      startField();
    };

    document.getElementById("fieldStatusButton").onclick = () => {
      se.click.play();
      showStatusScreen();
    };

    document.getElementById("fieldItemsButton").onclick = () => {
      se.click.play();
      showItemsScreen();
    };

    document.getElementById("fieldBackButton").onclick = () => {
      se.click.play();
      startVillage();
    };

    document.getElementById("fieldEncounterButton").onclick = () => {
      se.click.play();
      startBattle(false);
    };

    document.getElementById("fieldBossButton").onclick = () => {
      se.click.play();
      startBattle(true);
    };

    document.getElementById("statusBackButton").onclick = () => {
      se.click.play();
      if (isInBattle) showScreen("screen-battle");
      else if (currentShopType) showScreen("screen-shopMenu");
      else startVillage();
    };

    document.getElementById("itemsBackButton").onclick = () => {
      se.click.play();
      if (isInBattle) showScreen("screen-battle");
      else if (currentShopType) showScreen("screen-shopMenu");
      else startVillage();
    };

    document.getElementById("shopBuyButton").onclick = () => {
      se.click.play();
      showShopBuy();
    };

    document.getElementById("shopSellButton").onclick = () => {
      se.click.play();
      showShopSell();
    };

    document.getElementById("shopExitButton").onclick = () => {
      se.click.play();
      currentShopType = null;
      startVillage();
    };

    document.getElementById("shopBuyBackButton").onclick = () => {
      se.click.play();
      showScreen("screen-shopMenu");
    };

    document.getElementById("shopSellBackButton").onclick = () => {
      se.click.play();
      showScreen("screen-shopMenu");
    };

    document.getElementById("attackButton").onclick = () => {
      se.click.play();
      if (isInBattle) playerAttack();
    };

    document.getElementById("battleItemButton").onclick = () => {
      se.click.play();
      if (isInBattle) showItemsScreen();
    };

    document.getElementById("battleRunButton").onclick = () => {
      se.click.play();
      if (isInBattle) {
        appendBattleLog("にげだした！");
        isInBattle = false;
        startField();
      }
    };

    document.getElementById("popupYesButton").onclick = () => {
      se.click.play();
      if (popupAction === "useItem") useItem(popupPayload);
      else if (popupAction === "equipItem") equipItem(popupPayload);
      else if (popupAction === "sellItem") confirmSellItem(popupPayload);
      else if (popupAction === "sellEquip") confirmSellEquip(popupPayload);
      else if (popupAction === "resetGame") resetGame();
      hidePopup();
    };

    document.getElementById("popupNoButton").onclick = () => {
      se.click.play();
      hidePopup();
    };

    document.getElementById("endingToTitleButton").onclick = () => {
      se.click.play();
      player.hp = player.maxHp;
      startVillage();
    };
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