require 'sinatra'
require 'sinatra/json'
require 'json'

candidates = {
  'Dog' => 0,
  'Cat' => 0,
  'Fox' => 0,
  'Giraffe' => 0,
  'Wolf' => 0
}
voting = Mutex.new
users = {}
flag = ENV['FLAG'] || "DUMMY"
users["admin"] = flag # Can you read other's vote?

set :bind, '0.0.0.0'
set :port, 4567

post '/vote' do
  data = JSON.parse(request.body.read)
  username = data['username']
  candidate = data['candidate']

  if username == 'admin'
    status 403
    return json error: "Please don't do this, even if you can"
  end

  unless candidates.has_key?(candidate)
    status 400
    return json error: "Invalid candidate"
  end
  voting.synchronize do
    if users.has_key?(username) && candidates.has_key?(users[username])
      previous_vote = users[username]
      candidates[previous_vote] -= 1
    end

    candidates[candidate] += 1
    users[username] = candidate
  end

  status 200
end

post '/result' do
  d = request.body.read 
  data = JSON.parse(d)
  username = data['username']
  candidate = users[username]

  if candidate
    json candidate: candidate
  else
    status 403
    json error: "User not found"
  end
end

get '/summary' do
  max_votes = candidates.values.max
  leading_candidates = candidates.select { |k, v| v == max_votes }.keys

  json candidate: leading_candidates.sample
end
