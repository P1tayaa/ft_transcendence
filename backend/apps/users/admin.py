from django.contrib import admin
from .models import Profile, PlayerScore, Game, Chat, Follow, Block, Message

admin.site.register(Profile)
admin.site.register(Game)
admin.site.register(PlayerScore)
admin.site.register(Follow)
admin.site.register(Block)
admin.site.register(Chat)
admin.site.register(Message)

# admin.register(Profile)
# class ProfileAdmin(admin.ModelAdmin):
#     list_display = ('user', 'highscore', 'most_recent_game_score')
#     search_fields = ('user__username',)

# @admin.register(Game)
# class GameAdmin(admin.ModelAdmin):
#     list_display = ('id', 'winner', 'date', 'player_count')
#     list_filter = ('date',)
#     search_fields = ('winner__user__username',)

# @admin.register(PlayerScore)
# class PlayerScoreAdmin(admin.ModelAdmin):
#     list_display = ('game', 'profile', 'score', 'position')
#     list_filter = ('position',)
#     search_fields = ('profile__user__username',)

# @admin.register(Follow)
# class FollowAdmin(admin.ModelAdmin):
#     list_display = ('follower', 'followed', 'created_at')
#     list_filter = ('created_at',)
#     search_fields = ('follower__user__username', 'followed__user__username')

# @admin.register(Block)
# class BlockAdmin(admin.ModelAdmin):
#     list_display = ('blocker', 'blocked', 'blocked_at')
#     list_filter = ('blocked_at',)
#     search_fields = ('blocker__user__username', 'blocked__user__username')

# @admin.register(Chat)
# class ChatAdmin(admin.ModelAdmin):
#     list_display = ('id', 'sent_at', 'get_participants')
#     list_filter = ('sent_at',)


# def get_participants(self, obj):
#     return ", ".join([user.username for user in obj.participants.all()])
#     get_participants.short_description = 'Participants'

# @admin.register(Message)
# class MessageAdmin(admin.ModelAdmin):
#     def display_content(self, obj):
#         if len(obj.content) > 50:
#             return obj.content[:50] + "..."
#         return obj.content
#     display_content.short_description = 'Content Preview'

#     list_display = ('sender', 'chat', 'content_preview', 'timestamp', 'is_read')
#     list_filter = ('timestamp', 'is_read')
#     search_fields = ('sender__username', 'content')


