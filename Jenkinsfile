pipeline {
  agent any

  environment {
    SERVICE_DIR  = 'frontend-galenos-pro'
    SERVICE_NAME = 'frontend'
    IMAGE_NAME   = "galenos/frontend"
    SONAR_KEY    = 'galenos-frontend'
  }

  options {
    timeout(time: 20, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
    disableConcurrentBuilds()
    ansiColor('xterm')
    timestamps()
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        }
        echo "Branch: ${env.BRANCH_NAME} | Commit: ${env.GIT_SHORT}"
      }
    }

    stage('Install') {
      steps {
        dir("${SERVICE_DIR}") {
          sh 'npm ci --legacy-peer-deps'
        }
      }
    }

    stage('Test') {
      steps {
        dir("${SERVICE_DIR}") {
          sh 'npm test -- --watch=false'
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        dir("${SERVICE_DIR}") {
          withSonarQubeEnv('galenos-sonar') {
            sh """
              npx sonar-scanner \
                -Dsonar.projectKey=${SONAR_KEY} \
                -Dsonar.sources=src/app \
                -Dsonar.host.url=${env.SONAR_HOST_URL ?: 'http://sonarqube:9000'} \
                -Dsonar.token=${env.SONAR_TOKEN}
            """
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build') {
      steps {
        dir("${SERVICE_DIR}") {
          sh 'npm run build'
        }
      }
    }

    stage('Docker Build') {
      steps {
        dir("${SERVICE_DIR}") {
          sh "docker build -t ${IMAGE_NAME}:${GIT_SHORT} -t ${IMAGE_NAME}:latest ."
        }
      }
    }

    stage('Deploy') {
      when {
        anyOf { branch 'develop'; branch 'main' }
      }
      steps {
        dir('infrastructure') {
          sh "docker compose up -d --no-deps --build ${SERVICE_NAME}"
        }
      }
    }
  }

  post {
    success {
      echo "✅ ${SERVICE_NAME} desplegado — commit: ${env.GIT_SHORT}"
    }
    failure {
      echo "❌ Pipeline fallido — deploy bloqueado para ${SERVICE_NAME}"
    }
    always {
      cleanWs(cleanWhenAborted: true, cleanWhenFailure: false, cleanWhenSuccess: true)
    }
  }
}
