export interface LiveChatData {
    endpoint?: any;
    response: YTResponse;
    timing?: any;
    url?: string;
    xsrf_token?: string;
}

export interface YTResponse {
    continuationContents: ContinuationContent;
    responseContext: any;
    trackingParams?: string;
}

export interface ContinuationContent {
    liveChatContinuation: LiveChatContinuation;
}

export interface LiveChatContinuation {
    actions: LiveChatContinuationAction[];
    clientMessages?: any;
    continuations: (LiveChatReplayContinuation|PlayerSeekContinuation)[];
    emojis?: any[];
    header?: LiveChatHeader;
    isReplay?: boolean;
    itemList?: any;
    popoutMessage?: any;
    ticker?: any;
    trackingParams?: string;
    viewerName?: string;
}

export interface LiveChatReplayContinuation {
    liveChatReplayContinuationData: LiveChatReplayContinuationData;
}

export interface ContinuationData {
    continuation: string;
}

export interface LiveChatReplayContinuationData extends ContinuationData {
    timeUntilLastMessageMsec: number;
}

export interface PlayerSeekContinuation {
    playerSeekContinuationData: PlayerSeekContinuationData;
}

export interface PlayerSeekContinuationData extends ContinuationData {
}

export interface LiveChatHeader {
    liveChatHeaderRenderer: LiveChatHeaderRenderer;
}

export interface LiveChatHeaderRenderer {
    collapseButton: any;
    overflowMenu: any;
    viewSelector: SortFilterSubMenu;
}

export interface SortFilterSubMenu {
    sortFilterSubMenuRenderer: SortFilterSubMenuRenderer;
}

export interface SortFilterSubMenuRenderer {
    accessibility: any;
    subMenuItems: SortFilterSubMenuItem[];
}

export interface SortFilterSubMenuItem {
    accessibility: any;
    continuation: ReloadContinuation;
    selected: boolean;
    subtitle: string;
    title: string;
}

export interface ReloadContinuation {
    reloadContinuationData: ReloadContinuationData;
}

export interface ReloadContinuationData extends ContinuationData {
    clickTrackingParams: string;
}

export interface LiveChatContinuationAction {
    replayChatItemAction: ReplayChatItemAction;
}

export interface ReplayChatItemAction {
    actions: ReplayChatItemActionChild[];
    videoOffsetTimeMsec: string;
}

export interface ReplayChatItemActionChild {
    addChatItemAction: ReplayAddChatItemAction;
}

export interface ReplayAddChatItemAction {
    clientId: string;
    item: ReplayAddChatItemActionItem;
}

export interface ReplayAddChatItemActionItem {
    liveChatTextMessageRenderer?: LiveChatTextMessageRenderer;
    liveChatViewerEngagementMessageRenderer?: any;
}

export interface LiveChatTextMessageRenderer {
    authorExternalChannelId: string;
    authorName: LiveChatText;
    authorPhoto: any;
    contextMenuAccessibility: any;
    contextMenuEndpoint: any;
    id: string;
    message: LiveChatText;
    timestampUsec: string;
}

export interface LiveChatText {
    simpleText: string;
}