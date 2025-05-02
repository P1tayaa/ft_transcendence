from django.urls import path

from .management.user_management import (
    get_current_user,
    register_user,
    login_user,
    fetch_matching_usernames,
	get_user,
	get_match_history,
    follow_user,
    get_following,
    get_followers,
    unfollow_user,
    upload_profile_picture,
    delete_profile_picture,
    block_user,
    unblock_user,
    change_password,
    change_username
)

from .management.chat_management import (
    add_message,
    get_chat_history,
)

from .management.tournament_management import (
    create_tournament,
)

from .management.game_management import (
    create_game_room,
    get_config_game_room,
    list_game_rooms,
)

# here for API endpoints, pages are routed through templates
urlpatterns = [
    path("register/", register_user, name="register_user"),
    path("login/", login_user, name="login_user"),
    path("me/", get_current_user, name="current_user"),
    path("me/change_username/", change_username, name="change_username"),
    path("me/change_password/", change_password, name="change_password"),
    path("users/search/", fetch_matching_usernames, name="search"),
	path("users/<int:user_id>/", get_user, name="get_user"),
	path("users/matches/", get_match_history, name="get_match_history"),

    path("follow/", follow_user, name="follow_user"),
    path("follow/followers/", get_followers, name="get_followers"),
    path("follow/following/", get_following, name="get_following"),
    path("follow/unfollow/", unfollow_user, name="unfollow_user"),

    path("block/", block_user, name="block_user"),
    path("unblock/", unblock_user, name="unblock_user"),

    path("profile/picture/", upload_profile_picture, name="upload_profile_picture"),
    path("profile/picture/delete", delete_profile_picture, name="delete_profile_picture"),

    path("chats/", get_chat_history, name="get_chat_history"),
    path("chats/message/", add_message, name="add_message"),

    path("game/create/", create_game_room, name="create_game_room"),
    path("game/get/", get_config_game_room, name="get_config_game_room"),
    path("game/list/", list_game_rooms, name="list_game_rooms"),

    path('tournament/create/', create_tournament, name="create_tournament"),
]
