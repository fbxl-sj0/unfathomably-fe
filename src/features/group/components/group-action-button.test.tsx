import { beforeEach, describe, expect, it } from 'vitest';

import { buildGroup, buildGroupRelationship } from '@/jest/factory.ts';
import { render, screen } from '@/jest/test-helpers.tsx';
import { GroupRoles } from '@/schemas/group-member.ts';
import { Group } from '@/types/entities.ts';

import GroupActionButton from './group-action-button.tsx';

let group: Group;

describe('<GroupActionButton />', () => {
  describe('with no group relationship', () => {
    beforeEach(() => {
      group = buildGroup({
        relationship: null,
      });
    });

    describe('with a private group', () => {
      beforeEach(() => {
        group = { ...group, locked: true };
      });

      it('should render the Request Access button', () => {
        render(<GroupActionButton group={group} />);

        expect(screen.getByRole('button')).toHaveTextContent('Request Access');
      });
    });

    describe('with a public group', () => {
      beforeEach(() => {
        group = { ...group, locked: false };
      });

      it('should render the Join Group button', () => {
        render(<GroupActionButton group={group} />);

        expect(screen.getByRole('button')).toHaveTextContent('Join Group');
      });
    });
  });

  describe('with no group relationship member', () => {
    beforeEach(() => {
      group = buildGroup({
        relationship: buildGroupRelationship({
          member: false,
        }),
      });
    });

    describe('with a private group', () => {
      beforeEach(() => {
        group = { ...group, locked: true };
      });

      it('should render the Request Access button', () => {
        render(<GroupActionButton group={group} />);

        expect(screen.getByRole('button')).toHaveTextContent('Request Access');
      });
    });

    describe('with a public group', () => {
      beforeEach(() => {
        group = { ...group, locked: false };
      });

      it('should render the Join Group button', () => {
        render(<GroupActionButton group={group} />);

        expect(screen.getByRole('button')).toHaveTextContent('Join Group');
      });
    });
  });

  describe('when the user has requested to join', () => {
    beforeEach(() => {
      group = buildGroup({
        relationship: buildGroupRelationship({
          requested: true,
          member: false,
        }),
      });
    });

    it('should render the Cancel Request button', () => {
      render(<GroupActionButton group={group} />);

      expect(screen.getByRole('button')).toHaveTextContent('Cancel Request');
    });
  });

  describe('when the user is an Admin', () => {
    beforeEach(() => {
      group = buildGroup({
        relationship: buildGroupRelationship({
          requested: false,
          member: true,
          role: GroupRoles.OWNER,
        }),
      });
    });

    it('should render the Manage Group button', () => {
      render(<GroupActionButton group={group} />);

      expect(screen.getByRole('button')).toHaveTextContent('Manage Group');
    });
  });

  describe('when the user is a moderator', () => {
    beforeEach(() => {
      group = buildGroup({
        relationship: buildGroupRelationship({
          requested: false,
          member: true,
          role: GroupRoles.MODERATOR,
        }),
      });
    });

    it('should render the Manage Group button', () => {
      render(<GroupActionButton group={group} />);

      expect(screen.getByRole('button')).toHaveTextContent('Manage Group');
    });
  });

  describe('when the user is just a member', () => {
    beforeEach(() => {
      group = buildGroup({
        relationship: buildGroupRelationship({
          requested: false,
          member: true,
          role: GroupRoles.USER,
        }),
      });
    });

    it('should render the Leave Group button', () => {
      render(<GroupActionButton group={group} />);

      expect(screen.getByRole('button')).toHaveTextContent('Leave Group');
    });
  });

  describe('when the user is blocked from the group', () => {
    beforeEach(() => {
      group = buildGroup({
        relationship: buildGroupRelationship({
          blocked_by: true,
          can_follow: false,
          moderation_message: 'You are blocked from this group and cannot follow or post there.',
        }),
      });
    });

    it('should render a disabled blocked button with the moderation reason', () => {
      render(<GroupActionButton group={group} />);

      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveTextContent('Blocked from group');
      expect(screen.getByRole('button')).toHaveAttribute(
        'title',
        'You are blocked from this group and cannot follow or post there.',
      );
    });
  });

  describe('when federation policy blocks the group host', () => {
    beforeEach(() => {
      group = buildGroup({
        federation: {
          defederated: true,
          direction: 'local_policy',
          host: 'blocked.example',
          known: true,
          message: 'Federation paused',
          reason: 'Federation paused',
          severity: 'reject',
        },
        relationship: buildGroupRelationship({
          can_follow: false,
          federation_blocked: true,
          moderation_message: 'Federation paused',
        }),
      });
    });

    it('should render a disabled federation-blocked button with the policy reason', () => {
      render(<GroupActionButton group={group} />);

      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveTextContent('Federation blocked');
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Federation paused');
    });
  });
});
