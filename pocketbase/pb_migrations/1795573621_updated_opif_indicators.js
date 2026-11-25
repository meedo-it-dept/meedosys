/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1244961316")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || (section = @request.auth.section && (@request.body.section:isset = false || @request.body.section = @request.auth.section)))"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1244961316")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || section = @request.auth.section)"
  }, collection)

  return app.save(collection)
})
