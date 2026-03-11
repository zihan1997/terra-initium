FROM node:22-slim AS interview-ui-builder

WORKDIR /build
COPY ui/package.json ui/package-lock.json ./ui/
RUN cd ui && npm ci
COPY ui ./ui
COPY app ./app
RUN cd ui && npm run build

FROM node:22-slim AS openlens-ui-builder

WORKDIR /build
COPY openlens_ui/package.json openlens_ui/package-lock.json ./openlens_ui/
RUN cd openlens_ui && npm ci
COPY openlens_ui ./openlens_ui
COPY app ./app
RUN cd openlens_ui && npm run build:terra

FROM python:3.11-slim

WORKDIR /app

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./
COPY --from=interview-ui-builder /build/app/static/interview_questions ./static/interview_questions
COPY --from=openlens-ui-builder /build/app/static/openlens ./static/openlens

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
