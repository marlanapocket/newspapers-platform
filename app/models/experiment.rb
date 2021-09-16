class Experiment < ActiveRecord::Base

    belongs_to :user, optional: false
    validates :title, length: { minimum: 1 }

    def add_tool(parent_id, tool)
        if parent_id != 0
            self.locate_tool(self.description, parent_id) do |t|
                t['children'] << tool.to_h
            end
        else
            self.description['children'] << tool.to_h
        end
    end

    def delete_tool(tool_id)
        ids = detach_tool(self.description, nil, tool_id)
        puts ids
        return ids
    end

    def update_tool(tool_id, parameters)
        self.locate_tool(self.description, tool_id) do |t|
            t['tool']['parameters'].map! do |param|
                param['value'] = parameters[param['name']]
                param
            end
        end
    end

    private

    def detach_tool(tree, parent_array, tool_id, &block)
        if tree.has_key?('tool')
            if tree['tool']['id'] == tool_id
                ids = gather_ids(tree)
                parent_array.delete(tree) unless parent_array.nil?
                return ids
            else
                tree['children'].each do |subtree|
                    res = detach_tool(subtree, tree['children'], tool_id, &block)
                    return res unless res.nil?
                end
            end
        else
            tree['children'].each do |subtree|
                res = detach_tool(subtree, tree['children'], tool_id, &block)
                return res unless res.nil?
            end
        end
        nil
    end

    def gather_ids(tree, ids=[])
        if tree.has_key?('tool')
            ids << tree['tool']['id']
            tree['children'].each do |subtree|
                ids.concat(gather_ids(subtree))
            end
        end
        return ids
    end

    def locate_tool(tree_part, parent_id, &block)
        if tree_part.has_key?('tool')
            if tree_part['tool']['id'] == parent_id
                yield tree_part
                return true
            else
                tree_part['children'].each do |subtree|
                    break if locate_tool(subtree, parent_id, &block)
                end
            end
        else
            if tree_part['children'].empty?
                yield tree_part
            end
            tree_part['children'].each do |subtree|
                break if locate_tool(subtree, parent_id, &block)
            end
        end

    end

end
