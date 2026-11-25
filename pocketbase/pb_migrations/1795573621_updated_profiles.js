/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2975614142")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_profiles_username` ON `profiles` (`username`)",
      "CREATE UNIQUE INDEX `idx_profiles_username_lower` ON `profiles` (`username_lower`) WHERE `username_lower` != \"\"",
      "CREATE UNIQUE INDEX `idx_profiles_guard_id` ON `profiles` (`guard_id`) WHERE `guard_id` != \"\"",
      "CREATE UNIQUE INDEX `idx_profiles_firebase_uid` ON `profiles` (`firebase_uid`) WHERE `firebase_uid` != \"\"",
      "CREATE UNIQUE INDEX `idx_tokenKey_pbc_2975614142` ON `profiles` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_pbc_2975614142` ON `profiles` (`email`) WHERE `email` != ''"
    ],
    "manageRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "passwordAuth": {
      "enabled": false,
      "identityFields": [
        "email",
        "username"
      ]
    }
  }, collection)

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text800362833",
    "max": 0,
    "min": 0,
    "name": "firebase_uid",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3057579034",
    "max": 0,
    "min": 0,
    "name": "auth_provider",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2077391994",
    "max": 0,
    "min": 0,
    "name": "photo_url",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2975614142")

  // update collection data
  unmarshal({
    "createRule": "(@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")) || (role = \"Staff\" && status = \"Pending\" && section != \"ALL\")",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_profiles_username` ON `profiles` (`username`)",
      "CREATE UNIQUE INDEX `idx_profiles_username_lower` ON `profiles` (`username_lower`) WHERE `username_lower` != \"\"",
      "CREATE UNIQUE INDEX `idx_profiles_guard_id` ON `profiles` (`guard_id`) WHERE `guard_id` != \"\"",
      "CREATE UNIQUE INDEX `idx_tokenKey_pbc_2975614142` ON `profiles` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_pbc_2975614142` ON `profiles` (`email`) WHERE `email` != ''"
    ],
    "manageRule": null,
    "passwordAuth": {
      "enabled": true,
      "identityFields": [
        "username",
        "guard_id",
        "username_lower"
      ]
    }
  }, collection)

  // remove field
  collection.fields.removeById("text800362833")

  // remove field
  collection.fields.removeById("text3057579034")

  // remove field
  collection.fields.removeById("text2077391994")

  return app.save(collection)
})
