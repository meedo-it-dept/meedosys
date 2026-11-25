/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2554851632")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"D\")",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"D\")",
    "listRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"D\")",
    "updateRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"D\")",
    "viewRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"D\")"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2554851632")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
