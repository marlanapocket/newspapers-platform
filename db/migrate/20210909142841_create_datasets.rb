class CreateDatasets < ActiveRecord::Migration[6.1]
    def change
        create_table :datasets do |t|
            t.string :title
            t.references :user, foreign_key: true
            t.jsonb :documents, null: false, default: []
            t.boolean :public, default: false
            t.timestamps
        end
        add_index :datasets, [:title, :user_id], unique: true
    end
end
