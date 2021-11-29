class CreateCompoundArticles < ActiveRecord::Migration[6.1]
    def change
        create_table :compound_articles do |t|
            t.string :title
            t.string :issue_id
            t.string :newspaper
            t.string :date_created
            t.string :thumbnail_url
            t.string :language
            t.text :all_text
            t.references :user, foreign_key: true
            t.string :parts, array: true, default: []
            t.timestamps
        end
        add_index :compound_articles, [:title, :user_id], unique: true
    end
end
