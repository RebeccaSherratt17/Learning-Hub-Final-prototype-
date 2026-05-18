/**
 * Type declarations for the Vidyard embed API.
 * @vidyard/embed-code does not ship its own TypeScript definitions.
 */

interface VidyardPlayer {
  play(): void
  pause(): void
  resume(): void
  seek(seconds: number): void
  ready(): Promise<void>
  on(event: 'play', callback: () => void): void
  on(event: 'pause', callback: () => void): void
  on(event: 'playerComplete', callback: () => void): void
  on(event: 'videoComplete', callback: () => void): void
  on(event: 'timeupdate', callback: (currentTime: number) => void): void
  on(event: string, callback: (...args: unknown[]) => void): void
  off(event: string, callback: (...args: unknown[]) => void): void
  metadata: {
    name: string
    length: number
    description: string
    chapters_attributes: Array<{
      video_attributes: { name: string }
    }>
  }
  uuid: string
}

interface VidyardAPI {
  addReadyListener(
    callback: (data: unknown, player: VidyardPlayer) => void,
    uuid?: string,
  ): void
  getPlayersByUUID(uuid: string): VidyardPlayer[]
  renderDOMPlayers(container?: HTMLElement): void
  renderPlayer(
    options:
      | HTMLImageElement
      | { uuid: string; container: HTMLElement; type?: string; aspect?: string },
  ): Promise<VidyardPlayer>
  destroyPlayer(player: VidyardPlayer): void
  progressEvents(
    callback: (result: {
      player: VidyardPlayer
      chapter: number
      event: number
    }) => void,
    milestones: number[],
  ): void
}

declare module '@vidyard/embed-code' {
  const vidyardEmbed: { api: VidyardAPI }
  export default vidyardEmbed
}
