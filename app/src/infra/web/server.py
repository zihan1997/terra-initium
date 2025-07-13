from fastapi import Depends, Request, HTTPException, status

def login_required(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(
            detailstatus_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
            )
    return user_id