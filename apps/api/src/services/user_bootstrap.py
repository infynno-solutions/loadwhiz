from src.models.user import User


def build_user_bootstrap(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_email_verified": user.is_email_verified,
        "onboarding_completed": user.onboarding_completed,
        "active_organization_id": user.active_organization_id,
    }
