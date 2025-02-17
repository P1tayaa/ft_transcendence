from django.urls import path
# from .views import views
from .management.user_management import (
    get_current_user,
    register_user,
    login_user,
    logout_user,
    check_auth_status,
    fetch_matching_usernames,
    add_friend,
    get_friends,
    remove_friend,
)
from .management.chat_management import (
    get_chat_data,
    add_message,
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
    update_match_score,   
)

from .management.game_management import (
    create_game_room,
    clear_game_rooms
)

# here for API endpoints, pages are routed through templates
urlpatterns = [
    path("register/", register_user, name="register_user"),
    path("login/", login_user, name="login_user"),
    path("logout/", logout_user, name="logout_user"),
    path("auth-status/", check_auth_status, name="check_auth_status"),
    path("me/", get_current_user, name="current_user"),
    path("get_chat_data/", get_chat_data, name="get_chat_data"),
    path(
        "fetch_matching_usernames/",
        fetch_matching_usernames,
        name="fetch_matching_usernames",
    ),
    path("add_friend/", add_friend, name="add_friend"),
    path("get_friends/", get_friends, name="get_friends"),
    path("remove_friend/", remove_friend, name="remove_friend"),
    path("score/", get_score_history, name="get_score_history"),
    path("score/add", add_score, name="add_score"),
    path("score/recent", get_recent_score, name="get_recent_score"),
    path("score/highscore", get_highscore, name="get_highscore"),
    path("add_message/", add_message, name="add_message"),
    path("create_game/", create_game_room, name="create_game_room"),
    path("clean_game_rooms", clear_game_rooms, name="clear_game_rooms"),
    path('tournament/create/', create_tournament, name="create_tournament"),
    path('tournament/<int:tournament_id>/join', join_tournament, name="join_tournament"),
    path('tournament/<int:tournament_id>/get_data', get_tournament_data, name="get_tournament_data"),
    path('tournament/<int:match_id>/update_scores', update_match_score, name="update_match_scores"),

]
