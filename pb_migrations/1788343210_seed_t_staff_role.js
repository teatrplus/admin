/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const roleCollection = app.findCollectionByNameOrId("t_role")
  const staffRoleCollection = app.findCollectionByNameOrId("t_staff_role")

  const roles = [
    { id: "7ac0ec7a9c489a5", name_en: "Dobrodelus", name_ru: "Доброделус", name_uz: "Dobrodelus", type: "actor" },
    { id: "a4fdba62f8153fd", name_en: "Cat", name_ru: "Кот", name_uz: "Mushuk", type: "actor" },
    { id: "64b0ae6ab163578", name_en: "Prince", name_ru: "Принц", name_uz: "Shahzoda", type: "actor" },
    { id: "237a379c37e3869", name_en: "Soldier", name_ru: "Солдат", name_uz: "Askar", type: "actor" },
    { id: "003d076cf3824a6", name_en: "Robot", name_ru: "Робот", name_uz: "Robot", type: "actor" },
    { id: "8c738b655ef7673", name_en: "Song Doll", name_ru: "Кукла Песенка", name_uz: "Pesenka qo‘g‘irchog‘i", type: "actor" },
    { id: "b4d2ddffd64a5ce", name_en: "Strunka Doll", name_ru: "Кукла Струнка", name_uz: "Strunka qo‘g‘irchog‘i", type: "actor" },
    { id: "8c229dc1518e42a", name_en: "Domisol Doll", name_ru: "Кукла Домисоль", name_uz: "Domisolka qo‘g‘irchog‘i", type: "actor" },
    { id: "9978ace8037c134", name_en: "Teddy Bear", name_ru: "Мишка", name_uz: "Ayiqcha", type: "actor" },
    { id: "56a175506bdfe3a", name_en: "Rose", name_ru: "Роза", name_uz: "Atirgul", type: "actor" },
    { id: "cdf9187471348ea", name_en: "Painter", name_ru: "Художник", name_uz: "Rassom", type: "actor" },
    { id: "5d1a2eb7aacbea7", name_en: "Red Paint", name_ru: "Красная краска", name_uz: "Qizil bo‘yoq", type: "actor" },
    { id: "10608f5a6ee325b", name_en: "Green Paint", name_ru: "Зелёная краска", name_uz: "Yashil bo‘yoq", type: "actor" },
    { id: "41db3e8db1a3ba4", name_en: "Black Paint", name_ru: "Чёрная краска", name_uz: "Qora bo‘yoq", type: "actor" },
    { id: "f48dfb108691f69", name_en: "Yellow Paint", name_ru: "Жёлтая краска", name_uz: "Sariq bo‘yoq", type: "actor" },
    { id: "edd2094a5770416", name_en: "Blue Paint", name_ru: "Синяя краска", name_uz: "Ko‘k bo‘yoq", type: "actor" },
    { id: "6e63bbbac9da484", name_en: "Little Flames", name_ru: "Огоньки", name_uz: "Olovchalar", type: "actor" },
    { id: "00af7ed776995e0", name_en: "Little Leaf", name_ru: "Листик", name_uz: "Bargcha", type: "actor" },
    { id: "820758fd549a5ad", name_en: "Pea", name_ru: "Горох", name_uz: "No‘xat", type: "actor" },
    { id: "9b16a659dc4bcf0", name_en: "Frog", name_ru: "Лягушка", name_uz: "Qurbaqa", type: "actor" },
    { id: "5b297a79fa5f565", name_en: "Grasshopper", name_ru: "Кузнечик", name_uz: "Chigirtka", type: "actor" },
    { id: "a683492253bd513", name_en: "Shadows", name_ru: "Тени", name_uz: "Soyalar", type: "actor" },
    { id: "c92f650cb510360", name_en: "Sunbeams", name_ru: "Лучики", name_uz: "Nurlar", type: "actor" },
    { id: "820d43af357ecc5", name_en: "Sea Dwellers", name_ru: "Обитатели моря", name_uz: "Dengiz aholisi", type: "actor" }
  ]
  const staffRoles = [
    { id: "921a5b9af5525b7", staff: "85133d818ac308e", role: "7ac0ec7a9c489a5" },
    { id: "43d334a42761ddf", staff: "0e23f88702e8a8c", role: "a4fdba62f8153fd" },
    { id: "e75710d4cba89f2", staff: "9a80fa1ca1ba16a", role: "64b0ae6ab163578" },
    { id: "bfff38e390b81ae", staff: "27e8246ffa0e66b", role: "64b0ae6ab163578" },
    { id: "7b021e2398ae398", staff: "a6d29d8949f092c", role: "237a379c37e3869" },
    { id: "3ffbb2149b98f04", staff: "155b07b2c16e40c", role: "003d076cf3824a6" },
    { id: "22a1726632aab4b", staff: "003b8b99570890b", role: "8c738b655ef7673" },
    { id: "d176a5675202121", staff: "4de9fc20001ed0b", role: "8c738b655ef7673" },
    { id: "934c662da4af946", staff: "e1773687407f55a", role: "b4d2ddffd64a5ce" },
    { id: "e1c85263c59efef", staff: "4de9fc20001ed0b", role: "b4d2ddffd64a5ce" },
    { id: "6ba74d75c93b6e4", staff: "8897bb70e85baca", role: "8c229dc1518e42a" },
    { id: "5b65dea672e3770", staff: "d23919f619e4d76", role: "9978ace8037c134" },
    { id: "0f7509cf5acc52a", staff: "33e441fa29d2aff", role: "9978ace8037c134" },
    { id: "d1a2edfe4ca4a81", staff: "22144e479f11bf9", role: "56a175506bdfe3a" },
    { id: "e31ccc2370ef792", staff: "d23919f619e4d76", role: "56a175506bdfe3a" },
    { id: "47c720459f81e23", staff: "a6d29d8949f092c", role: "cdf9187471348ea" },
    { id: "b8c9298f1413bc8", staff: "27e8246ffa0e66b", role: "cdf9187471348ea" },
    { id: "930e3ceb3280c2e", staff: "22144e479f11bf9", role: "5d1a2eb7aacbea7" },
    { id: "9e4bde53455475f", staff: "33e441fa29d2aff", role: "10608f5a6ee325b" },
    { id: "a6162f0338710a9", staff: "8897bb70e85baca", role: "10608f5a6ee325b" },
    { id: "413f36548efda97", staff: "e1773687407f55a", role: "41db3e8db1a3ba4" },
    { id: "3b4bee3ad07edc7", staff: "33e441fa29d2aff", role: "41db3e8db1a3ba4" },
    { id: "67bd21570e1a776", staff: "003b8b99570890b", role: "f48dfb108691f69" },
    { id: "bacd7575ebc3852", staff: "4de9fc20001ed0b", role: "f48dfb108691f69" },
    { id: "1fa64d24dd4a3bd", staff: "d23919f619e4d76", role: "edd2094a5770416" },
    { id: "c11bb7186b90d65", staff: "9730b4b62a1e8af", role: "6e63bbbac9da484" },
    { id: "d06cdc0046ca45d", staff: "9a80fa1ca1ba16a", role: "6e63bbbac9da484" },
    { id: "f160a8cefbd8a5e", staff: "155b07b2c16e40c", role: "00af7ed776995e0" },
    { id: "25e11012a58036b", staff: "0e23f88702e8a8c", role: "00af7ed776995e0" },
    { id: "1e3aead05ef9794", staff: "85133d818ac308e", role: "820758fd549a5ad" },
    { id: "a48eb4199fc79bc", staff: "155b07b2c16e40c", role: "9b16a659dc4bcf0" },
    { id: "90a6630d3c84bc6", staff: "0e23f88702e8a8c", role: "9b16a659dc4bcf0" },
    { id: "65aeae930f0b921", staff: "d8f68c6e5cc2d6b", role: "5b297a79fa5f565" },
    { id: "b06b6891c234add", staff: "9730b4b62a1e8af", role: "a683492253bd513" },
    { id: "c3f0a297d5abb44", staff: "9a80fa1ca1ba16a", role: "a683492253bd513" },
    { id: "e29de697aacbdc5", staff: "9730b4b62a1e8af", role: "c92f650cb510360" },
    { id: "c264b0a386c225f", staff: "85133d818ac308e", role: "c92f650cb510360" },
    { id: "12fdf1dd33ca878", staff: "155b07b2c16e40c", role: "c92f650cb510360" },
    { id: "6ef02d8d49db1dc", staff: "27e8246ffa0e66b", role: "c92f650cb510360" },
    { id: "39cd18dda108bb6", staff: "0e23f88702e8a8c", role: "c92f650cb510360" },
    { id: "f02643756a36716", staff: "d8f68c6e5cc2d6b", role: "c92f650cb510360" },
    { id: "c551683646161fc", staff: "9730b4b62a1e8af", role: "820d43af357ecc5" },
    { id: "9c1421f01103ff8", staff: "155b07b2c16e40c", role: "820d43af357ecc5" },
    { id: "c5bea57b1671a73", staff: "9a80fa1ca1ba16a", role: "820d43af357ecc5" },
    { id: "e5ce2d27d09a8ad", staff: "27e8246ffa0e66b", role: "820d43af357ecc5" },
    { id: "e9dfb41510764b7", staff: "0e23f88702e8a8c", role: "820d43af357ecc5" },
    { id: "fe738a36b277714", staff: "d8f68c6e5cc2d6b", role: "820d43af357ecc5" }
  ]

  if (app.countRecords("t_role") === 0) {
    for (const row of roles) {
      const record = new Record(roleCollection)
      record.set("id", row.id)
      record.set("name_en", row.name_en)
      record.set("name_ru", row.name_ru)
      record.set("name_uz", row.name_uz)
      record.set("type", row.type)
      app.save(record)
    }
  }

  if (app.countRecords("t_staff_role") === 0) {
    for (const row of staffRoles) {
      const record = new Record(staffRoleCollection)
      record.set("id", row.id)
      record.set("staff", row.staff)
      record.set("role", row.role)
      app.save(record)
    }
  }

  const play_gohd1i0tdhgoo6b = app.findRecordById("t_play", "gohd1i0tdhgoo6b")
  play_gohd1i0tdhgoo6b.set("roles", ["921a5b9af5525b7", "43d334a42761ddf", "e75710d4cba89f2", "bfff38e390b81ae", "7b021e2398ae398", "3ffbb2149b98f04", "22a1726632aab4b", "d176a5675202121", "934c662da4af946", "e1c85263c59efef", "6ba74d75c93b6e4", "5b65dea672e3770", "0f7509cf5acc52a", "d1a2edfe4ca4a81", "e31ccc2370ef792"])
  app.save(play_gohd1i0tdhgoo6b)
  const play_g4y4xrydwm24afv = app.findRecordById("t_play", "g4y4xrydwm24afv")
  play_g4y4xrydwm24afv.set("roles", ["47c720459f81e23", "b8c9298f1413bc8", "930e3ceb3280c2e", "9e4bde53455475f", "a6162f0338710a9", "413f36548efda97", "3b4bee3ad07edc7", "67bd21570e1a776", "bacd7575ebc3852", "1fa64d24dd4a3bd", "c11bb7186b90d65", "d06cdc0046ca45d", "f160a8cefbd8a5e", "25e11012a58036b", "1e3aead05ef9794", "a48eb4199fc79bc", "90a6630d3c84bc6", "65aeae930f0b921", "b06b6891c234add", "c3f0a297d5abb44", "e29de697aacbdc5", "c264b0a386c225f", "12fdf1dd33ca878", "6ef02d8d49db1dc", "39cd18dda108bb6", "f02643756a36716", "c551683646161fc", "9c1421f01103ff8", "c5bea57b1671a73", "e5ce2d27d09a8ad", "e9dfb41510764b7", "fe738a36b277714"])
  app.save(play_g4y4xrydwm24afv)
}, (app) => {
  for (const playId of ["gohd1i0tdhgoo6b", "g4y4xrydwm24afv"]) {
    const play = app.findRecordById("t_play", playId)
    play.set("roles", [])
    app.save(play)
  }

  const staffRoleIds = [
    "921a5b9af5525b7",
    "43d334a42761ddf",
    "e75710d4cba89f2",
    "bfff38e390b81ae",
    "7b021e2398ae398",
    "3ffbb2149b98f04",
    "22a1726632aab4b",
    "d176a5675202121",
    "934c662da4af946",
    "e1c85263c59efef",
    "6ba74d75c93b6e4",
    "5b65dea672e3770",
    "0f7509cf5acc52a",
    "d1a2edfe4ca4a81",
    "e31ccc2370ef792",
    "47c720459f81e23",
    "b8c9298f1413bc8",
    "930e3ceb3280c2e",
    "9e4bde53455475f",
    "a6162f0338710a9",
    "413f36548efda97",
    "3b4bee3ad07edc7",
    "67bd21570e1a776",
    "bacd7575ebc3852",
    "1fa64d24dd4a3bd",
    "c11bb7186b90d65",
    "d06cdc0046ca45d",
    "f160a8cefbd8a5e",
    "25e11012a58036b",
    "1e3aead05ef9794",
    "a48eb4199fc79bc",
    "90a6630d3c84bc6",
    "65aeae930f0b921",
    "b06b6891c234add",
    "c3f0a297d5abb44",
    "e29de697aacbdc5",
    "c264b0a386c225f",
    "12fdf1dd33ca878",
    "6ef02d8d49db1dc",
    "39cd18dda108bb6",
    "f02643756a36716",
    "c551683646161fc",
    "9c1421f01103ff8",
    "c5bea57b1671a73",
    "e5ce2d27d09a8ad",
    "e9dfb41510764b7",
    "fe738a36b277714"
  ]
  const roleIds = [
    "7ac0ec7a9c489a5",
    "a4fdba62f8153fd",
    "64b0ae6ab163578",
    "237a379c37e3869",
    "003d076cf3824a6",
    "8c738b655ef7673",
    "b4d2ddffd64a5ce",
    "8c229dc1518e42a",
    "9978ace8037c134",
    "56a175506bdfe3a",
    "cdf9187471348ea",
    "5d1a2eb7aacbea7",
    "10608f5a6ee325b",
    "41db3e8db1a3ba4",
    "f48dfb108691f69",
    "edd2094a5770416",
    "6e63bbbac9da484",
    "00af7ed776995e0",
    "820758fd549a5ad",
    "9b16a659dc4bcf0",
    "5b297a79fa5f565",
    "a683492253bd513",
    "c92f650cb510360",
    "820d43af357ecc5"
  ]
  for (const id of staffRoleIds) {
    try {
      app.delete(app.findRecordById("t_staff_role", id))
    } catch (err) {}
  }
  for (const id of roleIds) {
    try {
      app.delete(app.findRecordById("t_role", id))
    } catch (err) {}
  }
})
