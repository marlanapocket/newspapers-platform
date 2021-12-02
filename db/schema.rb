# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_12_02_095539) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "compound_articles", force: :cascade do |t|
    t.string "title"
    t.string "issue_id"
    t.string "newspaper"
    t.string "date_created"
    t.string "thumbnail_url"
    t.string "language"
    t.text "all_text"
    t.bigint "user_id"
    t.string "parts", default: [], array: true
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["title", "user_id"], name: "index_compound_articles_on_title_and_user_id", unique: true
    t.index ["user_id"], name: "index_compound_articles_on_user_id"
  end

  create_table "datasets", force: :cascade do |t|
    t.string "title"
    t.bigint "user_id"
    t.jsonb "documents", default: [], null: false
    t.boolean "public", default: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["title", "user_id"], name: "index_datasets_on_title_and_user_id", unique: true
    t.index ["user_id"], name: "index_datasets_on_user_id"
  end

  create_table "experiments", force: :cascade do |t|
    t.string "title"
    t.bigint "user_id"
    t.jsonb "description", default: {"children"=>[]}
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["title", "user_id"], name: "index_experiments_on_title_and_user_id", unique: true
    t.index ["user_id"], name: "index_experiments_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id"
    t.string "content"
    t.boolean "read", default: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.string "session_id", null: false
    t.text "data"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["session_id"], name: "index_sessions_on_session_id", unique: true
    t.index ["updated_at"], name: "index_sessions_on_updated_at"
  end

  create_table "tools", force: :cascade do |t|
    t.bigint "experiment_id"
    t.bigint "parent_id"
    t.string "tool_type"
    t.string "input_type"
    t.string "output_type"
    t.jsonb "parameters", default: {}
    t.jsonb "results", default: {}
    t.string "status", default: "created"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["experiment_id"], name: "index_tools_on_experiment_id"
    t.index ["parent_id"], name: "index_tools_on_parent_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "compound_articles", "users"
  add_foreign_key "datasets", "users"
  add_foreign_key "experiments", "users"
  add_foreign_key "notifications", "users"
  add_foreign_key "tools", "experiments"
  add_foreign_key "tools", "tools", column: "parent_id"
end
