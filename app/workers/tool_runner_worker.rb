class ToolRunnerWorker
  include Sidekiq::Worker

  def perform(user_id)
      ActionCable.server.broadcast("notifications.#{user_id}", {test: 'done'})
  end
end
