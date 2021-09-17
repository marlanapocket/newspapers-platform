class AddTool < ActiveRecord::Migration[6.1]
  def change
      create_table :tools do |t|
          t.references :experiment, foreign_key: true
          t.references :parent, foreign_key: {to_table: :tools}
          t.string :tool_type
          t.string :input_type
          t.string :output_type
          t.jsonb :parameters, default: {}
          t.jsonb :results, default: {}
          t.string :status, default: "created"
          t.timestamps
      end
  end
end
