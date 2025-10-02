FROM amazoncorretto:17

RUN mkdir /app
COPY build/libs/portfolio-website-1.0-SNAPSHOT-all.jar /app/
CMD exec java -jar /app/portfolio-website-1.0-SNAPSHOT-all.jar
