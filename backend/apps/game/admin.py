from django.contrib import admin
from .models import GameRoom, GameConfig, PlayerState, TournamentMatch, TournamentParticipant, TournamentRoom, TournamentScore

class PlayerStateInline(admin.TabularInline):
    model = PlayerState
    extra = 0

@admin.register(GameConfig)
class GameConfigAdmin(admin.ModelAdmin):
    list_display = ('mode', 'player_count', 'map_style', 'powerups_enabled', 'created_at')
    list_filter = ('mode', 'map_style', 'powerups_enabled')
    search_fields = ('mode', 'map_style')

@admin.register(GameRoom)
class GameRoomAdmin(admin.ModelAdmin):
    list_display = ('room_name', 'status', 'is_active', 'created_at')
    list_filter = ('status', 'is_active', 'is_tournament_game')
    search_fields = ('room_name',)
    inlines = [PlayerStateInline]

class TournamentParticipantInline(.TabularInline):
    model = TournamentParticipant
    extra = 0

class TournamentScoreInline(admin.TabularInline):
    model = TournamentScore
    extra = 0

class TournamentMatchInline(admin.TabularInline):
    model = TournamentMatch
    extra = 0
    show_change_link = True

@admin.register(TournamentRoom)
class TournamentRoomAdmin(admin.ModelAdmin):
    list_display = ('tournament_name', 'status', 'is_active', 'created_at', 'max_participants')
    list_filter = ('status', 'is_active')
    search_fields = ('tournament_name',)
    inlines = [TournamentParticipantInline, TournamentScoreInline, TournamentMatchInline]

@admin.register(TournamentMatch)
class TournamentMatchAdmin(admin.ModelAdmin):
    list_display = ('room_name', 'tournament', 'round_number', 'match_number', 'status')
    list_filter = ('status', 'round_number')
    search_fields = ('room_name',)
    inlines = [PlayerStateInline]
