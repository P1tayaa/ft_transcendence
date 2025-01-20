USER:
  username
  password
  email
  user_image
  date_joined
  is_staff
  highscore
  lowest_score
  most_recent_game_score
  score_history(table, int)
  friendlist(table, user id)
  most_played_user
  most_chatted_user
  chat history(table, chat ids)


CHATS:
  - chat id
  - participants(user ids)
  - chat history(stack of strings, assigned to a user id)




games database
  -game(id)
    - num_players
    - player_ids(num_player)
    - id_score(num_player)
    - highest_score
    - game_mode_settings
      - powerups....



tournament stuff:
to add to user-> tournamnet wins, % of win, blabla
new table -> tournaments
  - tournament id
  - participants
  - blabla
  - settings
