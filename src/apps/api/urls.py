from django.urls import path
from django.conf import settings
from django.conf.urls.static import static


from .management.user_management import (
    get_current_user,
    register_user,
    login_user,
    logout_user,
    check_auth_status,
    fetch_matching_usernames,
    follow_user,
    get_following,
    get_followers,
    unfollow_user,
    upload_profile_picture,
    delete_profile_picture,
    block_user,
    unblock_user,
    get_blocked,
    change_password,
    change_username
)
from .management.chat_management import (
    add_message,
    get_chat_history,
    mark_messages_read,
    update_typing_status,
)
from .management.score_management import (
    add_score,
    get_score_history,
    get_recent_score,
    get_highscore,
)

from .management.tournament_management import (
    create_tournament,
    join_tournament,
    get_tournament_data,
    list_tournaments,
    update_match_score,
    leave_tournament,
)

from .management.game_management import (
    create_game_room,
    get_config_game_room,
    clear_chat_data,
    reset_dev_game_database
)

# here for API endpoints, pages are routed through templates
urlpatterns = [
    path("register/", register_user, name="register_user"),
    path("login/", login_user, name="login_user"),
    path("logout/", logout_user, name="logout_user"),
    # path("auth-status/", check_auth_status, name="check_auth_status"),
    path("me/", get_current_user, name="current_user"),
    path("me/change_username", change_username, name="change_username"),
    path("me/change_password", change_password, name="change_password"),
    path("search/", fetch_matching_usernames, name="search"),

    path("follow/", follow_user, name="follow_user"),
    path("follow/followers", get_followers, name="get_followers"),
    path("follow/following", get_following, name="get_following"),
    path("follow/unfollow", unfollow_user, name="unfollow_user"),

    path("block/", block_user, name="block_user"),
    path("block/unblock", unblock_user, name="unblock_user"),
    # path("block/get", get_blocked, name="get_blocked"),

    path("score/", get_score_history, name="get_score_history"),
    path("score/add", add_score, name="add_score"),
    path("score/recent", get_recent_score, name="get_recent_score"),
    # path("score/highscore", get_highscore, name="get_highscore"),

    path("profile/picture/", upload_profile_picture, name="upload_profile_picture"),
    path("profile/picture/delete", delete_profile_picture, name="delete_profile_picture"),

    path("chats/", get_chat_history, name="get_chat_history"),
    path("chats/message/", add_message, name="add_message"),
    # path("chats/message/typing", update_typing_status, name="update_typing"),
    # path("chats/message/read", mark_messages_read, name="mark_messages_read"),
    path('chat/clear', clear_chat_data, name="clear_chat_data"),

    path("game/create", create_game_room, name="create_game_room"),
    path("game/get", get_config_game_room, name="get_config_game_room"),
    path('dev_reset/', reset_dev_game_database, name="reset_game_database"),

    path('tournament/create/', create_tournament, name="create_tournament"),
    path('tournament/join/', join_tournament, name="join_tournament"),
    path('tournament/list/', list_tournaments, name="list_tournaments"),
    path('tournament/get/', get_tournament_data, name="get_tournament_data"),
    path('tournament/update_score/', update_match_score, name="update_match_scores"),
    path('tournament/leave/', leave_tournament, name="leave_tournament"),
]
