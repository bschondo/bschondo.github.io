"""Build static HTML site from directory of HTML templates and plain files."""
import sys
import pathlib
import json
import os
import shutil
import jinja2
import click


@click.command()
@click.argument('input_dir', required=True)
@click.option('-o', '--output', 'output',
              help='Output directory', type=str)
@click.option('-v', '--verbose', 'verbose',
              help='Print more output.', is_flag=True)
def main(input_dir, output, verbose):
    """Top level command line interface."""
    input_dir = pathlib.Path(input_dir)     # convert str to Path object

    if output is not None:
        output_dir = pathlib.Path(output)
    else:
        output_dir = input_dir/"html"       # default

    try:
        static_dir = input_dir/'static'
        if static_dir.is_dir():
            shutil.copytree(static_dir, output_dir)
            if verbose:
                print('Copied ' + str(static_dir) +
                      '/ -> ' + str(output_dir) + '/')
        else:
            os.mkdir(str(output_dir))
        config_file = open(str(input_dir/'config.json'))
        try:
            data = json.load(config_file)
        except json.JSONDecodeError as error:
            print(error)
            sys.exit(1)
    except FileNotFoundError as error:
        print(error)
        sys.exit(1)

    for x_data in data:
        url = x_data['url'].lstrip('/')
        template_name = x_data['template']

        try:
            template_env = jinja2.Environment(
                loader=jinja2.FileSystemLoader(str(input_dir/'templates')),
                autoescape=jinja2.select_autoescape(['html', 'xml']))
            render = template_env.get_template(template_name).render(
                x_data['context'])
        except jinja2.TemplateNotFound as error:
            print(error)
            sys.exit(1)

        output_path = output_dir/url/'index.html'
        if not (output_dir/url).is_dir():
            os.makedirs(str(output_dir/url))
        try:
            out = open(str(output_path), "w")
        except FileNotFoundError as error:
            print(error)
            sys.exit(1)
        if verbose:
            print('Rendered ', template_name, '-> ', output_path)
        out.write(render)


if __name__ == "__main__":
    main()
