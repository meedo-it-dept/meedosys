/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_592998565")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"B\")",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"B\")",
    "listRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"B\")",
    "updateRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"B\")",
    "viewRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"B\")"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_592998565")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "listRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "updateRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "viewRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")"
  }, collection)

  return app.save(collection)
})
