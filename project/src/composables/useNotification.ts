/**
 * 通知機能を提供するコンポーザブル
 *
 * このコンポーザブルはアプリケーション全体で通知を表示するための機能を提供します。
 * シングルトンパターンで実装されているため、どのコンポーネントからも同じ状態にアクセスできます。
 * 
 * 使用例:
 * ```typescript
 * // 任意のコンポーネントで
 * import { useNotification } from '@/composables/useNotification';
 * 
 * const { showNotification } = useNotification();
 * 
 * // 成功通知を表示
 * showNotification('success', '保存完了', 'データが正常に保存されました');
 * 
 * // エラー通知を表示
 * showNotification('error', 'エラー', '接続に失敗しました');
 * ```
 * 
 * 注意: このコンポーザブルはApp.vueで自動的に初期化されるため、
 * 通常のコンポーネントでは単に`useNotification`を呼び出すだけで使用できます。
 */
import { ref } from 'vue';

/**
 * 通知のプロパティを定義するインターフェース
 */
export interface Notification {
  /** 通知の種類（成功、エラー、情報、警告） */
  type: 'success' | 'error' | 'info' | 'warning';
  /** 通知のタイトル */
  title: string;
  /** 通知の詳細メッセージ */
  message: string;
  /** 通知を表示する時間（ミリ秒）- 省略時はデフォルト値が使用される */
  timeout?: number;
}

/**
 * 通知コンポーネントが実装すべきインターフェース
 */
export interface NotificationsComponent {
  /** 新しい通知を追加する */
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  /** 指定されたIDの通知を削除する */
  removeNotification: (id: string) => void;
  /** すべての通知をクリアする */
  clearAllNotifications: () => void;
  /** 現在の通知リスト */
  notifications: Notification[];
}

// シングルトンパターンでグローバルな状態を保持
const notificationsRef = ref<NotificationsComponent | null>(null);

/**
 * 通知機能を使用するためのコンポーザブル
 * @returns 通知関連の操作を提供するオブジェクト
 */
export function useNotification() {
  /**
   * 新しい通知を表示する
   * @param type 通知の種類（success、error、info、warning）
   * @param title 通知のタイトル
   * @param message 通知の詳細メッセージ
   * @param timeout 通知を表示する時間（ミリ秒）
   */
  const showNotification = (type: Notification['type'], title: string, message: string, timeout?: number) => {
    if (notificationsRef.value) {
      notificationsRef.value.addNotification({
        type,
        title,
        message,
        timeout
      });
    } else {
      console.warn('通知コンポーネントが初期化されていません');
    }
  };

  /**
   * 通知コンポーネントの参照を設定する（内部使用）
   * @param ref 通知コンポーネントへの参照
   */
  const setNotificationsRef = (ref: NotificationsComponent) => {
    notificationsRef.value = ref;
  };

  /**
   * すべての通知をクリアする
   */
  const clearAllNotifications = () => {
    if (notificationsRef.value) {
      notificationsRef.value.clearAllNotifications();
    } else {
      console.warn('通知コンポーネントが初期化されていません');
    }
  };

  // 戻り値オブジェクト
  return {
    // 公開API - すべてのコンポーネントで使用可能
    showNotification,
    clearAllNotifications,
    
    // 内部API - App.vueでのみ使用
    setNotificationsRef
  };
} 