FROM ruby:3.2

WORKDIR /app

COPY Gemfile Gemfile.lock ./

RUN bundle install

COPY app.rb ./app.rb

RUN useradd -m user
RUN chown -R root:user /app/app.rb

USER user
EXPOSE 4567

CMD ["ruby", "app.rb"]
