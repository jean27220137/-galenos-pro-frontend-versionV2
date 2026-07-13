pipeline {
  agent any

  environment {
    SERVICE_DIR  = 'frontend-galenos-pro'
    SERVICE_NAME = 'frontend'
    SONAR_KEY    = 'galenos-pro-frontend'
  }

  options {
    timeout(time: 20, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
    disableConcurrentBuilds()
    timestamps()
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        dir("${SERVICE_DIR}") {
          sh 'npm ci --legacy-peer-deps'
        }
      }
    }

    stage('Test y Cobertura') {
      steps {
        dir("${SERVICE_DIR}") {
          sh 'npm run test:coverage'
        }
      }
    }

    stage('Análisis SonarQube') {
      steps {
        dir("${SERVICE_DIR}") {
          withSonarQubeEnv('SonarQube-Galenos') {
            sh """
              npx sonar-scanner \
                -Dsonar.projectKey=${SONAR_KEY} \
                -Dsonar.projectName='Galenos Pro - Frontend' \
                -Dsonar.sources=src/app \
                -Dsonar.exclusions=**/*.spec.ts,**/environments/** \
                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                -Dsonar.host.url=${SONAR_HOST_URL} \
                -Dsonar.token=${SONAR_AUTH_TOKEN}
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

    stage('Build Producción') {
      steps {
        dir("${SERVICE_DIR}") {
          sh 'npm run build'
        }
      }
    }

  }

  post {
    success {
      echo 'Frontend aprobado — build listo para despliegue'
    }
    failure {
      echo 'Pipeline fallido — corregir antes de hacer push'
    }
    always {
      cleanWs(cleanWhenAborted: true, cleanWhenFailure: false, cleanWhenSuccess: true)
    }
  }
}
