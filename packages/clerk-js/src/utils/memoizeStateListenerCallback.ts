import { ClientResource, ListenerCallback, Resources, SessionResource, UserResource } from '@clerk/types';
import { Client, Session, User } from 'core/resources/internal';

type AcceptedResource = UserResource | ClientResource | SessionResource;

function clientChanged(prev: ClientResource, next: ClientResource): boolean {
  return (
    prev.id !== next.id ||
    prev.updatedAt!.getTime() < next.updatedAt!.getTime() ||
    prev.sessions.length !== next.sessions.length
  );
}

function sessionChanged(prev: SessionResource, next: SessionResource): boolean {
  return prev.id !== next.id || prev.updatedAt.getTime() < next.updatedAt.getTime();
}

function userChanged(prev: UserResource, next: UserResource): boolean {
  return prev.id !== next.id || prev.updatedAt!.getTime() < next.updatedAt!.getTime();
}

// TODO: Decide if this belongs in the resources
function resourceChanged<T extends AcceptedResource | undefined | null>(prev: T, next: T): boolean {
  // support the setSession undefined intermediate state
  if ((!prev && !!next) || (!!prev && !next)) {
    return true;
  }

  if (!prev && prev === next) {
    return false;
  }

  // Help TS infer types correctly
  if (!prev || !next) {
    return true;
  }

  try {
    if (Client.isClientResource(prev)) {
      return clientChanged(prev, next as ClientResource);
    }

    if (Session.isSessionResource(prev)) {
      return sessionChanged(prev, next as SessionResource);
    }

    if (User.isUserResource(prev)) {
      return userChanged(prev, next as UserResource);
    }
  } catch (e) {
    // If something goes terribly wrong, prefer doing an unnecessary rerender
    return true;
  }

  return true;
}

function getSameOrUpdatedResource<T extends UserResource | ClientResource | SessionResource | undefined | null>(
  prev: T,
  next: T,
): T {
  return resourceChanged(prev, next) ? next : prev;
}

function stateWithMemoizedResources(cur: Resources, next: Resources): Resources {
  return {
    client: getSameOrUpdatedResource(cur.client, next.client),
    session: getSameOrUpdatedResource(cur.session, next.session),
    user: getSameOrUpdatedResource(cur.user, next.user),
  };
}

export function memoizeListenerCallback(cb: ListenerCallback): ListenerCallback {
  let memo: Resources;
  return e => {
    memo ||= { ...e };
    memo = { ...stateWithMemoizedResources(memo, e) };
    cb(memo);
  };
}
